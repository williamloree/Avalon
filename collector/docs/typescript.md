# Intégration Avalon avec TypeScript

Guide d'intégration d'Avalon pour vos applications TypeScript.

## Installation

```bash
npm install axios
# ou
yarn add axios
```

## Types et Interfaces

Créez un fichier `types/avalon.types.ts` :

```typescript
export type ErrorLevel = 'critical' | 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorContext {
  message?: string;
  stack?: string;
  path?: string;
  method?: string;
}

export interface ErrorPayload {
  service: string;
  error: ErrorContext;
  level: ErrorLevel;
  metadata?: Record<string, any>;
}

export interface AvalonResponse {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
}

export interface ReportErrorOptions {
  level?: ErrorLevel;
  path?: string;
  method?: string;
  metadata?: Record<string, any>;
}
```

## Client TypeScript

Créez un fichier `lib/avalon-client.ts` :

```typescript
import axios, { AxiosInstance } from 'axios';
import type { ErrorLevel, ErrorPayload, AvalonResponse, ReportErrorOptions } from '../types/avalon.types';

export class AvalonClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly serviceName: string;

  constructor(collectorUrl: string, serviceName: string) {
    this.serviceName = serviceName;
    this.axiosInstance = axios.create({
      baseURL: collectorUrl.replace(/\/$/, ''),
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Report an error to Avalon
   */
  async reportError(
    error: Error | unknown,
    options: ReportErrorOptions = {}
  ): Promise<string | null> {
    const {
      level = 'error',
      path = null,
      method = null,
      metadata = {},
    } = options;

    const payload: ErrorPayload = {
      service: this.serviceName,
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : new Error().stack,
        path: path ?? undefined,
        method: method ?? undefined,
      },
      level,
      metadata,
    };

    try {
      const response = await this.axiosInstance.post<AvalonResponse>('/report', payload);
      return response.data.id ?? null;
    } catch (err) {
      console.error('Failed to report error to Avalon:', err);
      return null;
    }
  }

  /**
   * Report a critical error
   */
  async critical(error: Error | unknown, options?: Omit<ReportErrorOptions, 'level'>): Promise<string | null> {
    return this.reportError(error, { ...options, level: 'critical' });
  }

  /**
   * Report a fatal error
   */
  async fatal(error: Error | unknown, options?: Omit<ReportErrorOptions, 'level'>): Promise<string | null> {
    return this.reportError(error, { ...options, level: 'fatal' });
  }

  /**
   * Report a warning
   */
  async warning(error: Error | unknown, options?: Omit<ReportErrorOptions, 'level'>): Promise<string | null> {
    return this.reportError(error, { ...options, level: 'warning' });
  }

  /**
   * Report an info message
   */
  async info(message: string, options?: Omit<ReportErrorOptions, 'level'>): Promise<string | null> {
    return this.reportError(new Error(message), { ...options, level: 'info' });
  }

  /**
   * Report a debug message
   */
  async debug(message: string, options?: Omit<ReportErrorOptions, 'level'>): Promise<string | null> {
    return this.reportError(new Error(message), { ...options, level: 'debug' });
  }
}

// Singleton instance
let avalonInstance: AvalonClient | null = null;

export function initializeAvalon(collectorUrl: string, serviceName: string): AvalonClient {
  if (!avalonInstance) {
    avalonInstance = new AvalonClient(collectorUrl, serviceName);
  }
  return avalonInstance;
}

export function getAvalon(): AvalonClient {
  if (!avalonInstance) {
    throw new Error('Avalon not initialized. Call initializeAvalon() first.');
  }
  return avalonInstance;
}
```

## Utilisation Basique

```typescript
import { initializeAvalon, getAvalon } from './lib/avalon-client';

// Initialiser une seule fois au démarrage de l'application
const avalon = initializeAvalon('http://localhost:4000', 'my-typescript-app');

// Utiliser partout dans l'application
async function fetchUser(userId: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    await getAvalon().reportError(error, {
      level: 'error',
      path: `/api/users/${userId}`,
      method: 'GET',
      metadata: { userId },
    });
    throw error;
  }
}
```

## Décorateur pour les méthodes de classe

```typescript
function CatchErrors(level: ErrorLevel = 'error') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        await getAvalon().reportError(error, {
          level,
          path: `${target.constructor.name}.${propertyKey}`,
          metadata: {
            args: args.map(arg => typeof arg === 'object' ? '[Object]' : arg),
          },
        });
        throw error;
      }
    };

    return descriptor;
  };
}

// Utilisation
class UserService {
  @CatchErrors('error')
  async getUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }

  @CatchErrors('critical')
  async deleteUser(id: string): Promise<void> {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
  }
}
```

## Wrapper pour fonctions async

```typescript
type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

export function withErrorReporting<T extends AsyncFunction>(
  fn: T,
  options: ReportErrorOptions = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      await getAvalon().reportError(error, {
        ...options,
        metadata: {
          ...options.metadata,
          functionName: fn.name,
          arguments: args.map(arg => typeof arg === 'object' ? '[Object]' : arg),
        },
      });
      throw error;
    }
  }) as T;
}

// Utilisation
const fetchUserWithReporting = withErrorReporting(
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  { level: 'error', path: '/api/users/:id', method: 'GET' }
);
```

## Custom Error Classes

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly level: ErrorLevel = 'error',
    public readonly metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }

  async report(avalon: AvalonClient, path?: string, method?: string): Promise<void> {
    await avalon.reportError(this, {
      level: this.level,
      path,
      method,
      metadata: {
        ...this.metadata,
        errorCode: this.code,
      },
    });
  }
}

// Utilisation
class ValidationError extends AppError {
  constructor(message: string, field: string) {
    super(message, 'VALIDATION_ERROR', 'warning', { field });
    this.name = 'ValidationError';
  }
}

// Dans votre code
try {
  if (!email.includes('@')) {
    throw new ValidationError('Invalid email format', 'email');
  }
} catch (error) {
  if (error instanceof AppError) {
    await error.report(getAvalon(), '/api/register', 'POST');
  }
  throw error;
}
```

## Gestionnaire d'erreurs global

```typescript
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private avalon: AvalonClient;

  private constructor(avalon: AvalonClient) {
    this.avalon = avalon;
    this.setupHandlers();
  }

  static initialize(avalon: AvalonClient): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler(avalon);
    }
    return GlobalErrorHandler.instance;
  }

  private setupHandlers(): void {
    // Erreurs non gérées
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError(event.error, {
          path: window.location.pathname,
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason, {
          metadata: {
            promise: '[Promise]',
            type: 'unhandledrejection',
          },
        });
      });
    }

    // Node.js
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.handleError(error, { level: 'fatal' });
      });

      process.on('unhandledRejection', (reason) => {
        this.handleError(reason, { level: 'error' });
      });
    }
  }

  private async handleError(error: unknown, options: ReportErrorOptions = {}): Promise<void> {
    await this.avalon.reportError(error, {
      level: 'error',
      ...options,
    });
  }

  async captureException(error: unknown, options?: ReportErrorOptions): Promise<void> {
    await this.handleError(error, options);
  }
}

// Initialisation
const avalon = initializeAvalon('http://localhost:4000', 'my-app');
GlobalErrorHandler.initialize(avalon);
```

## Types utilitaires

```typescript
// Type guard pour les erreurs
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Type pour les résultats avec erreur
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export async function tryCatch<T>(
  fn: () => Promise<T>,
  options?: ReportErrorOptions
): Promise<Result<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    await getAvalon().reportError(error, options);
    return {
      success: false,
      error: isError(error) ? error : new Error(String(error)),
    };
  }
}

// Utilisation
const result = await tryCatch(
  () => fetchUser('123'),
  { level: 'error', path: '/api/users/123' }
);

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## Configuration avec environnements

```typescript
// config/avalon.config.ts
interface AvalonConfig {
  collectorUrl: string;
  serviceName: string;
  enabled: boolean;
  environment: string;
}

export const avalonConfig: AvalonConfig = {
  collectorUrl: process.env.AVALON_COLLECTOR_URL || 'http://localhost:4000',
  serviceName: process.env.AVALON_SERVICE_NAME || 'my-app',
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV || 'development',
};

// Wrapper conditionnel
export class ConditionalAvalonClient extends AvalonClient {
  private readonly enabled: boolean;

  constructor(config: AvalonConfig) {
    super(config.collectorUrl, config.serviceName);
    this.enabled = config.enabled;
  }

  async reportError(error: Error | unknown, options: ReportErrorOptions = {}): Promise<string | null> {
    if (!this.enabled) {
      console.warn('[Avalon] Disabled in development:', error);
      return null;
    }
    return super.reportError(error, {
      ...options,
      metadata: {
        ...options.metadata,
        environment: avalonConfig.environment,
      },
    });
  }
}
```

## Bonnes pratiques TypeScript

1. **Toujours typer vos erreurs**
```typescript
catch (error: unknown) {
  if (error instanceof SpecificError) {
    // Handle specific error
  }
  await avalon.reportError(error);
}
```

2. **Utiliser des types stricts**
```typescript
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

3. **Créer des types personnalisés pour vos métadonnées**
```typescript
interface UserErrorMetadata {
  userId: string;
  action: 'create' | 'update' | 'delete';
  timestamp: number;
}

await avalon.reportError(error, {
  metadata: {
    userId: '123',
    action: 'update',
    timestamp: Date.now(),
  } satisfies UserErrorMetadata,
});
```

4. **Utiliser les génériques**
```typescript
async function fetchWithErrorReporting<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    await getAvalon().reportError(error, {
      path: url,
      method: options?.method || 'GET',
    });
    throw error;
  }
}
```

## Tests avec Mock

```typescript
// __mocks__/avalon-client.ts
export const mockReportError = jest.fn().mockResolvedValue('mock-id');

export class AvalonClient {
  reportError = mockReportError;
  critical = jest.fn();
  fatal = jest.fn();
  warning = jest.fn();
  info = jest.fn();
  debug = jest.fn();
}

// Dans vos tests
import { mockReportError } from './__mocks__/avalon-client';

test('should report error', async () => {
  await someFunction();
  expect(mockReportError).toHaveBeenCalledWith(
    expect.any(Error),
    expect.objectContaining({
      level: 'error',
      path: '/api/test',
    })
  );
});
```

## Niveaux d'erreur

| Niveau     | Type TypeScript | Usage                        |
|------------|----------------|------------------------------|
| `critical` | `'critical'`   | Erreur critique              |
| `fatal`    | `'fatal'`      | Erreur fatale                |
| `error`    | `'error'`      | Erreur standard              |
| `warning`  | `'warning'`    | Avertissement                |
| `info`     | `'info'`       | Information                  |
| `debug`    | `'debug'`      | Debug                        |
