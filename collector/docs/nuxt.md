# Intégration Avalon avec Nuxt.js 3

Guide complet d'intégration d'Avalon pour vos applications Nuxt.js 3. Cette documentation couvre l'installation, la configuration client/serveur, et les patterns recommandés pour capturer et rapporter les erreurs.

## Table des matières

1. [Installation](#installation)
2. [TypeScript Client](#typescript-client)
3. [Plugin Nuxt 3](#plugin-nuxt-3)
4. [Middleware Serveur](#middleware-serveur)
5. [Gestion des Erreurs Client](#gestion-des-erreurs-client)
6. [Gestion des Erreurs Serveur](#gestion-des-erreurs-serveur)
7. [Routes API](#routes-api)
8. [Composables](#composables)
9. [Configuration runtimeConfig](#configuration-runtimeconfig)
10. [Bonnes Pratiques](#bonnes-pratiques)

## Installation

### 1. Installer les dépendances

```bash
npm install axios
# ou
yarn add axios
# ou
pnpm add axios
```

### 2. Structure des fichiers

Créez la structure suivante dans votre projet Nuxt:

```
project/
├── utils/
│   └── avalon-client.ts
├── composables/
│   └── useErrorReporting.ts
├── plugins/
│   └── avalon.ts
├── server/
│   └── middleware/
│       └── avalon.ts
└── nuxt.config.ts
```

## TypeScript Client

Créez le client Avalon TypeScript réutilisable:

### `utils/avalon-client.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

/**
 * Types pour le client Avalon
 */
export type ErrorLevel = 'critical' | 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorPayload {
  message: string;
  stack: string;
  path?: string | null;
  method?: string | null;
}

export interface ReportOptions {
  level?: ErrorLevel;
  path?: string | null;
  method?: string | null;
  metadata?: Record<string, any>;
}

export interface AvalonReportPayload {
  service: string;
  error: ErrorPayload;
  level: ErrorLevel;
  metadata: Record<string, any>;
}

export interface ReportResponse {
  id: string;
  success: boolean;
  timestamp?: string;
}

/**
 * Client Avalon pour reporting d'erreurs
 *
 * @example
 * const avalon = new AvalonClient('http://localhost:4000', 'my-nuxt-app');
 * await avalon.reportError(error, { level: 'error', path: '/api/users' });
 */
export class AvalonClient {
  private client: AxiosInstance;
  private collectorUrl: string;
  private serviceName: string;

  constructor(collectorUrl: string, serviceName: string) {
    this.collectorUrl = collectorUrl.replace(/\/$/, '');
    this.serviceName = serviceName;

    this.client = axios.create({
      baseURL: this.collectorUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Rapporte une erreur à Avalon
   *
   * @param error - L'erreur ou exception
   * @param options - Options de reporting
   * @returns L'ID d'erreur ou null en cas d'échec
   */
  async reportError(
    error: Error | unknown,
    options: ReportOptions = {}
  ): Promise<string | null> {
    const {
      level = 'error',
      path = null,
      method = null,
      metadata = {}
    } = options;

    const errorMessage = this.extractErrorMessage(error);
    const errorStack = this.extractErrorStack(error);

    const payload: AvalonReportPayload = {
      service: this.serviceName,
      error: {
        message: errorMessage,
        stack: errorStack,
        path,
        method
      },
      level,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : null,
        ...metadata
      }
    };

    try {
      const response = await this.client.post<ReportResponse>(
        '/report',
        payload
      );
      return response.data.id || null;
    } catch (err) {
      console.error('Failed to report error to Avalon:', err);
      return null;
    }
  }

  /**
   * Rapporte plusieurs erreurs en batch
   */
  async reportErrors(
    errors: Array<{ error: Error | unknown; options?: ReportOptions }>
  ): Promise<(string | null)[]> {
    return Promise.all(
      errors.map(({ error, options }) => this.reportError(error, options))
    );
  }

  /**
   * Extrait le message d'erreur
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      return (error as any).message || JSON.stringify(error);
    }
    return String(error);
  }

  /**
   * Extrait la stack trace
   */
  private extractErrorStack(error: unknown): string {
    if (error instanceof Error && error.stack) {
      return error.stack;
    }
    try {
      return new Error().stack || '';
    } catch {
      return '';
    }
  }

  /**
   * Met à jour le nom du service
   */
  setServiceName(name: string): void {
    this.serviceName = name;
  }

  /**
   * Met à jour l'URL du collecteur
   */
  setCollectorUrl(url: string): void {
    this.collectorUrl = url.replace(/\/$/, '');
    this.client.defaults.baseURL = this.collectorUrl;
  }
}
```

## Plugin Nuxt 3

Créez un plugin pour intégrer Avalon dans votre application Nuxt:

### `plugins/avalon.ts`

```typescript
import { AvalonClient } from '~/utils/avalon-client';

export default defineNuxtPlugin((nuxtApp) => {
  // Récupérer la configuration depuis runtimeConfig
  const config = useRuntimeConfig();

  if (!config.public.avalon?.collectorUrl || !config.public.avalon?.serviceName) {
    console.warn('Avalon configuration missing. Error reporting disabled.');
    return;
  }

  // Initialiser le client Avalon
  const avalon = new AvalonClient(
    config.public.avalon.collectorUrl,
    config.public.avalon.serviceName
  );

  // Fournir le client à travers l'application
  nuxtApp.provide('avalon', avalon);

  // Capturer les erreurs globales Nuxt
  if (process.client) {
    // Erreurs non gérées côté client
    nuxtApp.hook('vue:error', (err: any) => {
      avalon.reportError(err, {
        level: 'error',
        path: useRouter()?.currentRoute?.value?.path || null,
        metadata: {
          context: 'vue-error-hook',
          component: err.component || null
        }
      });
    });

    // Erreurs globales JavaScript
    window.addEventListener('error', (event) => {
      avalon.reportError(event.error || event.message, {
        level: 'error',
        path: window.location.pathname,
        metadata: {
          context: 'window-error-event',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      avalon.reportError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          level: 'warning',
          path: window.location.pathname,
          metadata: {
            context: 'unhandled-rejection'
          }
        }
      );
    });
  }

  // Hook composable du router pour capturer les erreurs de navigation
  const router = useRouter();
  router.afterEach((to, from, failure) => {
    if (failure) {
      avalon.reportError(failure, {
        level: 'warning',
        path: to.path,
        metadata: {
          context: 'router-navigation-failure',
          from: from.path,
          to: to.path,
          failureType: failure.type
        }
      });
    }
  });
});
```

## Middleware Serveur

Créez un middleware serveur pour capturer les erreurs côté serveur:

### `server/middleware/avalon.ts`

```typescript
import { AvalonClient, ErrorLevel } from '~/utils/avalon-client';

/**
 * Middleware Avalon pour capturer les erreurs serveur
 *
 * Ce middleware :
 * - Capture les erreurs non gérées
 * - Enregistre les erreurs 5xx
 * - Enregistre les erreurs de timeout
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Vérifier la configuration Avalon
  if (!config.avalon?.collectorUrl || !config.avalon?.serviceName) {
    return;
  }

  // Initialiser le client (côté serveur uniquement)
  const avalon = new AvalonClient(
    config.avalon.collectorUrl,
    config.avalon.serviceName
  );

  // Wrapper l'handler pour capturer les erreurs
  try {
    return await event.node.res.on('finish', () => {
      // Capturer les erreurs 5xx
      if (event.node.res.statusCode >= 500) {
        avalon.reportError(
          new Error(`Server Error: ${event.node.res.statusCode}`),
          {
            level: event.node.res.statusCode === 503 ? 'critical' : 'error',
            path: event.node.req.url,
            method: event.node.req.method,
            metadata: {
              statusCode: event.node.res.statusCode,
              context: 'server-middleware'
            }
          }
        );
      }
    });
  } catch (error) {
    // Les erreurs du middleware lui-même sont gérées par le gestionnaire d'erreurs global
    console.error('Avalon middleware error:', error);
  }
});
```

## Gestion des Erreurs Client

### Error Page avec Rapport Automatique

Créez une page d'erreur qui rapporte automatiquement les erreurs:

### `app.vue` ou `error.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';

defineProps({
  error: Object
});

const isReported = ref(false);
const errorId = ref<string | null>(null);

const { $avalon } = useNuxtApp();

/**
 * Rapporte l'erreur à Avalon
 */
const reportError = async () => {
  if (!$avalon || isReported.value) return;

  try {
    const id = await $avalon.reportError(error, {
      level: 'error',
      path: useRouter()?.currentRoute?.value?.path || null,
      metadata: {
        context: 'error-page',
        errorType: error?.value?.constructor?.name
      }
    });

    errorId.value = id;
    isReported.value = true;
  } catch (err) {
    console.error('Failed to report error:', err);
  }
};

onMounted(() => {
  // Rapporter automatiquement après 2 secondes
  setTimeout(() => {
    reportError();
  }, 2000);
});

const clearError = () => {
  navigateTo('/');
};
</script>

<template>
  <div class="error-page">
    <div class="error-container">
      <h1>Une erreur est survenue</h1>

      <div class="error-details" v-if="error">
        <p class="error-message">{{ error.message || 'Une erreur inconnue' }}</p>
        <details v-if="error.stack" class="error-stack">
          <summary>Détails techniques</summary>
          <pre>{{ error.stack }}</pre>
        </details>
      </div>

      <div class="error-status" v-if="isReported">
        <p v-if="errorId" class="success">
          ✓ Erreur rapportée (ID: {{ errorId }})
        </p>
        <p v-else class="error">
          Impossible de rapporter l'erreur
        </p>
      </div>

      <button @click="clearError" class="btn btn-primary">
        Retour à l'accueil
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.error-container {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #d32f2f;
  margin-bottom: 1rem;
}

.error-message {
  color: #666;
  font-weight: 500;
  margin: 1rem 0;
}

.error-stack {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  border-left: 4px solid #d32f2f;
}

.error-stack pre {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  overflow-x: auto;
}

.error-status {
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 4px;
}

.error-status .success {
  color: #388e3c;
  background: #e8f5e9;
  padding: 0.5rem;
  border-radius: 4px;
}

.error-status .error {
  color: #d32f2f;
  background: #ffebee;
  padding: 0.5rem;
  border-radius: 4px;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}
</style>
```

## Gestion des Erreurs Serveur

### Global Error Handler Côté Serveur

Créez un gestionnaire d'erreurs global:

### `server/utils/error-handler.ts`

```typescript
import { AvalonClient, ErrorLevel } from '~/utils/avalon-client';
import type { H3Error } from 'h3';

/**
 * Classe pour encapsuler le contexte d'erreur serveur
 */
export class ServerErrorContext {
  constructor(
    public error: Error | H3Error,
    public path: string,
    public method: string,
    public statusCode: number,
    public body?: any
  ) {}

  getLevel(): ErrorLevel {
    if (this.statusCode >= 500) {
      return this.statusCode === 503 ? 'critical' : 'error';
    }
    if (this.statusCode >= 400) {
      return 'warning';
    }
    return 'info';
  }

  getMetadata() {
    return {
      statusCode: this.statusCode,
      context: 'server-error-handler',
      body: typeof this.body === 'object' ? JSON.stringify(this.body) : this.body,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Rapporte une erreur serveur à Avalon
 */
export async function reportServerError(
  avalon: AvalonClient,
  context: ServerErrorContext
): Promise<void> {
  try {
    await avalon.reportError(context.error, {
      level: context.getLevel(),
      path: context.path,
      method: context.method,
      metadata: context.getMetadata()
    });
  } catch (err) {
    console.error('Failed to report server error to Avalon:', err);
  }
}

/**
 * Crée un gestionnaire d'erreurs H3
 */
export function createH3ErrorHandler(avalon: AvalonClient) {
  return (error: H3Error | Error, event: any) => {
    const path = event.node.req.url || '/unknown';
    const method = event.node.req.method || 'UNKNOWN';
    const statusCode = 'statusCode' in error ? error.statusCode : 500;

    const context = new ServerErrorContext(
      error,
      path,
      method,
      statusCode
    );

    reportServerError(avalon, context);

    // Retourner une réponse d'erreur normalisée
    return {
      statusCode,
      message: error.message || 'Internal server error',
      id: null // Peut être rempli avec l'ID d'erreur Avalon
    };
  };
}
```

### Configuration dans `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  nitro: {
    errorHandler: '~/server/middleware/error-handler.ts'
  }
});
```

## Routes API

Créez des routes API avec gestion d'erreurs Avalon:

### `server/api/users.ts`

```typescript
import { AvalonClient } from '~/utils/avalon-client';

const avalon = new AvalonClient(
  process.env.AVALON_COLLECTOR_URL || 'http://localhost:4000',
  process.env.AVALON_SERVICE_NAME || 'my-nuxt-app'
);

/**
 * Wrapper pour les handlers API avec gestion d'erreurs
 */
function withErrorHandling(handler: any) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      // Rapporter l'erreur
      await avalon.reportError(error, {
        level: 'error',
        path: event.node.req.url,
        method: event.node.req.method,
        metadata: {
          context: 'api-handler',
          query: getQuery(event),
          routeParams: event.context.params
        }
      });

      // Retourner une erreur normalisée
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: {
          message: error instanceof Error ? error.message : 'An error occurred'
        }
      });
    }
  });
}

/**
 * GET /api/users - Récupère la liste des utilisateurs
 */
export default withErrorHandling(async (event) => {
  const query = getQuery(event);

  // Simulation de récupération d'utilisateurs
  if (!query.limit) {
    throw new Error('Query parameter "limit" is required');
  }

  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];

  return {
    success: true,
    data: users,
    limit: query.limit
  };
});
```

### `server/api/users/[id].ts`

```typescript
import { AvalonClient } from '~/utils/avalon-client';

const avalon = new AvalonClient(
  process.env.AVALON_COLLECTOR_URL || 'http://localhost:4000',
  process.env.AVALON_SERVICE_NAME || 'my-nuxt-app'
);

function withErrorHandling(handler: any) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      await avalon.reportError(error, {
        level: 'error',
        path: event.node.req.url,
        method: event.node.req.method,
        metadata: {
          context: 'api-handler',
          routeParams: event.context.params
        }
      });

      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error'
      });
    }
  });
}

/**
 * GET /api/users/:id - Récupère un utilisateur par ID
 */
export default withErrorHandling(async (event) => {
  const { id } = event.context.params;

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID'
    });
  }

  // Simulation de recherche
  const user = { id: Number(id), name: `User ${id}` };

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    });
  }

  return {
    success: true,
    data: user
  };
});

/**
 * POST /api/users/:id - Met à jour un utilisateur
 */
export const POST = withErrorHandling(async (event) => {
  const { id } = event.context.params;
  const body = await readBody(event);

  if (!id) {
    throw new Error('User ID is required');
  }

  if (!body.name) {
    throw new Error('User name is required');
  }

  // Simulation de mise à jour
  return {
    success: true,
    message: `User ${id} updated`,
    data: { id: Number(id), ...body }
  };
});

/**
 * DELETE /api/users/:id - Supprime un utilisateur
 */
export const DELETE = withErrorHandling(async (event) => {
  const { id } = event.context.params;

  if (!id) {
    throw new Error('User ID is required');
  }

  return {
    success: true,
    message: `User ${id} deleted`
  };
});
```

## Composables

Créez des composables réutilisables pour le reporting d'erreurs:

### `composables/useErrorReporting.ts`

```typescript
import type { ErrorLevel, ReportOptions } from '~/utils/avalon-client';

/**
 * Composable pour le reporting d'erreurs
 *
 * @example
 * const { reportError, isReporting } = useErrorReporting();
 * await reportError(error, { level: 'error' });
 */
export const useErrorReporting = () => {
  const { $avalon } = useNuxtApp();
  const router = useRouter();
  const isReporting = ref(false);
  const lastErrorId = ref<string | null>(null);

  /**
   * Rapporte une erreur
   */
  const reportError = async (
    error: Error | unknown,
    options?: ReportOptions
  ): Promise<string | null> => {
    if (!$avalon) {
      console.warn('Avalon client not available');
      return null;
    }

    isReporting.value = true;
    try {
      const id = await $avalon.reportError(error, {
        path: router.currentRoute.value.path,
        ...options
      });

      lastErrorId.value = id;
      return id;
    } finally {
      isReporting.value = false;
    }
  };

  /**
   * Rapporte une erreur avec contexte automatique
   */
  const reportErrorWithContext = async (
    error: Error | unknown,
    context: Record<string, any> = {}
  ): Promise<string | null> => {
    return reportError(error, {
      metadata: {
        component: context.component || null,
        action: context.action || null,
        ...context
      }
    });
  };

  /**
   * Rapporte un avertissement
   */
  const reportWarning = (
    message: string,
    metadata?: Record<string, any>
  ): Promise<string | null> => {
    return reportError(new Error(message), {
      level: 'warning',
      metadata
    });
  };

  /**
   * Rapporte une information
   */
  const reportInfo = (
    message: string,
    metadata?: Record<string, any>
  ): Promise<string | null> => {
    return reportError(new Error(message), {
      level: 'info',
      metadata
    });
  };

  /**
   * Rapporte une erreur critique
   */
  const reportCritical = (
    error: Error | unknown,
    metadata?: Record<string, any>
  ): Promise<string | null> => {
    return reportError(error, {
      level: 'critical',
      metadata
    });
  };

  return {
    reportError,
    reportErrorWithContext,
    reportWarning,
    reportInfo,
    reportCritical,
    isReporting,
    lastErrorId
  };
};
```

### `composables/useAsyncData.ts` - Extension pour gestion d'erreurs

```typescript
/**
 * Wrapper pour useAsyncData avec reporting d'erreurs automatique
 *
 * @example
 * const { data, error } = await useAsyncDataWithErrorReporting(
 *   'users',
 *   () => $fetch('/api/users')
 * );
 */
export const useAsyncDataWithErrorReporting = async (
  key: string,
  fn: () => Promise<any>,
  options?: any
) => {
  const { reportError } = useErrorReporting();

  const result = await useAsyncData(
    key,
    async () => {
      try {
        return await fn();
      } catch (error) {
        // Rapporter l'erreur mais laisser useAsyncData la gérer aussi
        await reportError(error, {
          level: 'error',
          metadata: {
            asyncDataKey: key,
            context: 'async-data-wrapper'
          }
        });
        throw error;
      }
    },
    options
  );

  return result;
};

/**
 * Wrapper pour useFetch avec reporting d'erreurs automatique
 */
export const useFetchWithErrorReporting = (
  url: string | (() => string),
  options?: any
) => {
  const { reportError } = useErrorReporting();

  return useFetch(url, {
    ...options,
    onError: async (context) => {
      await reportError(context.error, {
        level: 'error',
        path: typeof url === 'string' ? url : null,
        metadata: {
          context: 'fetch-error',
          method: options?.method || 'GET',
          status: context.response?.status
        }
      });

      // Appeler le callback original s'il existe
      if (options?.onError) {
        options.onError(context);
      }
    }
  });
};
```

### `composables/useTryCatch.ts` - Wrapper pour try-catch avec Avalon

```typescript
/**
 * Composable pour wrapping de try-catch avec reporting automatique
 *
 * @example
 * const { execute, isLoading, error } = useTryCatch(async () => {
 *   return await $fetch('/api/data');
 * });
 */
export const useTryCatch = (callback: () => Promise<any>) => {
  const { reportError } = useErrorReporting();
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const data = ref<any>(null);

  const execute = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      data.value = await callback();
      return data.value;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));

      // Rapporter l'erreur
      await reportError(error.value, {
        level: 'error',
        metadata: {
          context: 'try-catch-wrapper'
        }
      });

      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    execute,
    isLoading: readonly(isLoading),
    error: readonly(error),
    data: readonly(data)
  };
};
```

## Configuration runtimeConfig

Configurez Avalon dans `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  // Configuration publique (accessible côté client)
  runtimeConfig: {
    // Privée (serveur uniquement)
    avalon: {
      collectorUrl: process.env.AVALON_COLLECTOR_URL || 'http://localhost:4000',
      serviceName: process.env.AVALON_SERVICE_NAME || 'nuxt-app'
    },

    // Publique (client + serveur)
    public: {
      avalon: {
        collectorUrl: process.env.NUXT_PUBLIC_AVALON_COLLECTOR_URL || 'http://localhost:4000',
        serviceName: process.env.NUXT_PUBLIC_AVALON_SERVICE_NAME || 'nuxt-app',
        enabled: process.env.NUXT_PUBLIC_AVALON_ENABLED !== 'false',
        logLevel: process.env.NUXT_PUBLIC_AVALON_LOG_LEVEL || 'error'
      }
    }
  }
});
```

### Variables d'environnement (`.env`)

```bash
# URL du collecteur Avalon
AVALON_COLLECTOR_URL=http://localhost:4000
AVALON_SERVICE_NAME=my-nuxt-app

# Configuration publique
NUXT_PUBLIC_AVALON_COLLECTOR_URL=http://localhost:4000
NUXT_PUBLIC_AVALON_SERVICE_NAME=my-nuxt-app
NUXT_PUBLIC_AVALON_ENABLED=true
NUXT_PUBLIC_AVALON_LOG_LEVEL=error
```

## Exemples Pratiques

### Formulaire avec Gestion d'Erreurs

```vue
<script setup lang="ts">
import { ref } from 'vue';

const { reportErrorWithContext } = useErrorReporting();
const isSubmitting = ref(false);
const formData = ref({
  email: '',
  password: ''
});

const handleSubmit = async () => {
  isSubmitting.value = true;

  try {
    if (!formData.value.email) {
      throw new Error('Email is required');
    }

    const response = await $fetch('/api/login', {
      method: 'POST',
      body: formData.value
    });

    // Succès
    navigateTo('/dashboard');
  } catch (error) {
    // Rapporter avec contexte
    await reportErrorWithContext(error, {
      component: 'LoginForm',
      action: 'submit',
      hasEmail: !!formData.value.email
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input
      v-model="formData.email"
      type="email"
      placeholder="Email"
      required
    />
    <input
      v-model="formData.password"
      type="password"
      placeholder="Password"
      required
    />
    <button :disabled="isSubmitting">
      {{ isSubmitting ? 'Connexion...' : 'Se connecter' }}
    </button>
  </form>
</template>
```

### Composant avec Chargement Asynchrone

```vue
<script setup lang="ts">
import { useAsyncDataWithErrorReporting } from '~/composables/useAsyncData';

const { data: users, error, pending } = await useAsyncDataWithErrorReporting(
  'users',
  () => $fetch('/api/users', { query: { limit: 10 } })
);
</script>

<template>
  <div>
    <div v-if="pending">Chargement...</div>
    <div v-else-if="error">
      Erreur lors du chargement des utilisateurs
    </div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>
```

### Intercepteur Global pour fetch

```typescript
// plugins/fetch-interceptor.ts
export default defineNuxtPlugin(() => {
  const { $avalon } = useNuxtApp();
  const router = useRouter();

  // Intercepteur global pour $fetch
  $fetch.create({
    async onError({ error }) {
      if ($avalon) {
        await $avalon.reportError(error, {
          level: 'error',
          path: router.currentRoute.value.path,
          metadata: {
            context: 'fetch-interceptor'
          }
        });
      }
    }
  });
});
```

## Structure Nuxt Complète

```
my-nuxt-app/
├── .env
├── .env.example
├── nuxt.config.ts
├── tsconfig.json
├── package.json
│
├── app.vue
├── error.vue
│
├── composables/
│   ├── useErrorReporting.ts
│   └── useAsyncData.ts
│
├── pages/
│   ├── index.vue
│   ├── dashboard.vue
│   └── users/
│       └── [id].vue
│
├── components/
│   ├── Header.vue
│   ├── Footer.vue
│   └── UserForm.vue
│
├── plugins/
│   ├── avalon.ts
│   └── fetch-interceptor.ts
│
├── utils/
│   └── avalon-client.ts
│
└── server/
    ├── api/
    │   ├── login.post.ts
    │   ├── users.ts
    │   └── users/
    │       ├── [id].get.ts
    │       ├── [id].post.ts
    │       └── [id].delete.ts
    │
    └── middleware/
        ├── avalon.ts
        └── error-handler.ts
```

## Bonnes Pratiques

### 1. Ne pas bloquer l'application

```typescript
// ❌ Mauvais - bloque si Avalon est indisponible
await avalon.reportError(error);
throw error;

// ✓ Bon - ne bloque pas
avalon.reportError(error).catch(console.error);
throw error;
```

### 2. Ajouter des métadonnées pertinentes

```typescript
// ✓ Bon contexte
await reportError(error, {
  metadata: {
    userId: user?.id,
    feature: 'user-registration',
    environment: process.env.NODE_ENV,
    version: '1.2.3'
  }
});
```

### 3. Utiliser les niveaux d'erreur appropriés

```typescript
// Erreur critique nécessitant une intervention
reportCritical(paymentError, { action: 'payment-processing' });

// Erreur standard
reportError(validationError);

// Avertissement
reportWarning('API rate limit approaching', { remaining: 10 });

// Information
reportInfo('User logged in', { userId });
```

### 4. Éviter les données sensibles

```typescript
// ❌ Mauvais - expose les données sensibles
await reportError(error, {
  metadata: {
    password: user.password,
    token: authToken,
    creditCard: user.creditCard
  }
});

// ✓ Bon - données anonymisées
await reportError(error, {
  metadata: {
    userId: user.id,
    hasAuthToken: !!authToken,
    cardLastDigits: user.creditCard?.slice(-4)
  }
});
```

### 5. Timeout court

```typescript
// Le client Avalon utilise déjà un timeout de 5s
// Ne jamais attendre trop longtemps
avalon.reportError(error).catch(console.error);
```

### 6. Grouper les erreurs similaires

```typescript
// Utiliser des métadonnées consistantes pour grouper
await reportError(error, {
  metadata: {
    feature: 'checkout',
    step: 'payment',
    errorCode: 'PAYMENT_FAILED'
  }
});
```

## Structure du Payload

Chaque erreur rapportée à Avalon a cette structure:

```json
{
  "service": "my-nuxt-app",
  "error": {
    "message": "User not found",
    "stack": "Error: User not found\n    at getUserById (server/api/users/[id].ts:15:20)\n    ...",
    "path": "/api/users/123",
    "method": "GET"
  },
  "level": "error",
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "userAgent": "Mozilla/5.0...",
    "url": "http://localhost:3000/users/123",
    "userId": "user_123",
    "environment": "production",
    "version": "1.2.3"
  }
}
```

## Dépannage

### Avalon ne reçoit pas les erreurs

1. Vérifier que `AVALON_COLLECTOR_URL` est configuré
2. Vérifier que le service Avalon est en cours d'exécution
3. Vérifier la console du navigateur pour les erreurs de CORS
4. Vérifier les logs serveur Nuxt

### Performance

- Les appels Avalon sont asynchrones et ne bloquent pas
- Timeout de 5 secondes par défaut
- Les erreurs d'Avalon lui-même ne cassent pas l'application

### Développement vs Production

```typescript
// Désactiver en développement si souhaité
if (process.env.NODE_ENV === 'development') {
  // config.public.avalon.enabled = false;
}
```

## Ressources Additionnelles

- Documentation Nuxt 3: https://nuxt.com
- Avalon API: `/report` endpoint
- TypeScript: Support complet avec types personnalisés
- Error handling: Suivre les patterns Vue/Nuxt officiels

## Support

Pour toute question sur l'intégration Avalon:
- Consultez la documentation officielle Avalon
- Vérifiez les exemples dans ce fichier
- Testez avec un simple script de test d'erreur

## Licence

Cette documentation est fournie avec le collecteur d'erreurs Avalon.
