# Integration Avalon avec React

Guide complet d'intégration d'Avalon pour vos applications React modernes (React 18+).

## Table of Contents

1. [Installation](#installation)
2. [TypeScript Client Implementation](#typescript-client-implementation)
3. [Error Boundary Component](#error-boundary-component)
4. [useAvalon Hook](#useavalon-hook)
5. [Context Provider](#context-provider)
6. [Integration with Popular Libraries](#integration-with-popular-libraries)
7. [Event Handlers Error Catching](#event-handlers-error-catching)
8. [Async Errors in useEffect](#async-errors-in-useeffect)
9. [Production vs Development Mode](#production-vs-development-mode)
10. [Best Practices](#best-practices)

## Installation

### Step 1: Install Dependencies

```bash
npm install axios
# ou
yarn add axios

# Pour TypeScript (optionnel mais recommandé)
npm install --save-dev typescript
```

### Step 2: Verify React Version

Ce guide suppose React 18+. Vérifiez votre version dans `package.json`:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

## TypeScript Client Implementation

### AvalonClient Class

Créez un fichier `src/services/avalon-client.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

export type ErrorLevel = 'critical' | 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorMetadata {
  [key: string]: any;
  userId?: string;
  userAgent?: string;
  environment?: string;
  version?: string;
  requestId?: string;
  component?: string;
  action?: string;
  customData?: Record<string, any>;
}

export interface ReportErrorOptions {
  level?: ErrorLevel;
  path?: string | null;
  method?: string | null;
  metadata?: ErrorMetadata;
}

export interface ErrorReport {
  service: string;
  error: {
    message: string;
    stack: string;
    path: string | null;
    method: string | null;
  };
  level: ErrorLevel;
  metadata: ErrorMetadata;
  timestamp?: string;
}

export interface ApiErrorResponse {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
}

export class AvalonClient {
  private axiosInstance: AxiosInstance;
  private collectorUrl: string;
  private serviceName: string;
  private isDevelopment: boolean;

  constructor(
    collectorUrl: string,
    serviceName: string,
    isDevelopment = process.env.NODE_ENV === 'development'
  ) {
    this.collectorUrl = collectorUrl.replace(/\/$/, '');
    this.serviceName = serviceName;
    this.isDevelopment = isDevelopment;

    this.axiosInstance = axios.create({
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (this.isDevelopment) {
          console.error('Avalon client error:', error.message);
        }
        throw error;
      }
    );
  }

  /**
   * Report an error to Avalon collector
   */
  async reportError(
    error: Error | string,
    options: ReportErrorOptions = {}
  ): Promise<string | null> {
    const {
      level = 'error',
      path = null,
      method = null,
      metadata = {},
    } = options;

    const errorMessage = typeof error === 'string' ? error : (error.message || String(error));
    const errorStack = error instanceof Error ? (error.stack || new Error().stack || '') : new Error().stack || '';

    const payload: ErrorReport = {
      service: this.serviceName,
      error: {
        message: errorMessage,
        stack: errorStack,
        path,
        method,
      },
      level,
      metadata: {
        ...metadata,
        environment: this.isDevelopment ? 'development' : 'production',
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const response = await this.axiosInstance.post<ApiErrorResponse>(
        `${this.collectorUrl}/report`,
        payload
      );

      if (response.data?.status === 'ok' && response.data?.id) {
        if (this.isDevelopment) {
          console.log(`Error reported to Avalon with ID: ${response.data.id}`);
        }
        return response.data.id;
      }
      return null;
    } catch (err) {
      console.error('Failed to report error to Avalon:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  /**
   * Report an error with additional React component context
   */
  async reportReactError(
    error: Error | string,
    componentName: string,
    options: ReportErrorOptions = {}
  ): Promise<string | null> {
    return this.reportError(error, {
      ...options,
      metadata: {
        ...options.metadata,
        component: componentName,
        reactVersion: React.version,
      },
    });
  }

  /**
   * Report an error from an event handler
   */
  async reportEventError(
    error: Error | string,
    eventType: string,
    options: ReportErrorOptions = {}
  ): Promise<string | null> {
    return this.reportError(error, {
      ...options,
      metadata: {
        ...options.metadata,
        eventType,
        action: options.metadata?.action || eventType,
      },
    });
  }

  /**
   * Set development mode
   */
  setDevelopmentMode(isDevelopment: boolean): void {
    this.isDevelopment = isDevelopment;
  }

  /**
   * Get the collector URL
   */
  getCollectorUrl(): string {
    return this.collectorUrl;
  }

  /**
   * Get the service name
   */
  getServiceName(): string {
    return this.serviceName;
  }
}

// Export a singleton instance
let avalonInstance: AvalonClient | null = null;

export function initializeAvalon(
  collectorUrl: string,
  serviceName: string,
  isDevelopment?: boolean
): AvalonClient {
  avalonInstance = new AvalonClient(collectorUrl, serviceName, isDevelopment);
  return avalonInstance;
}

export function getAvalon(): AvalonClient {
  if (!avalonInstance) {
    throw new Error('Avalon has not been initialized. Call initializeAvalon() first.');
  }
  return avalonInstance;
}

import React from 'react';
```

## Error Boundary Component

### ErrorBoundary with Avalon Integration

Créez `src/components/ErrorBoundary.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { getAvalon } from '../services/avalon-client';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console in development
    console.error('ErrorBoundary caught:', error, errorInfo);

    // Report to Avalon
    const avalon = getAvalon();
    const componentName = this.props.componentName || 'Unknown Component';

    avalon.reportReactError(error, componentName, {
      level: 'error',
      metadata: {
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
      },
    }).catch((err) => {
      console.error('Failed to report error to Avalon:', err);
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={styles.container}>
            <div style={styles.content}>
              <h1 style={styles.title}>Oops! Something went wrong</h1>
              <p style={styles.message}>
                We've been notified and are working to fix the issue.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details style={styles.details}>
                  <summary style={styles.summary}>Error Details</summary>
                  <pre style={styles.pre}>
                    {this.state.error?.toString()}
                  </pre>
                </details>
              )}
              <button onClick={this.handleReset} style={styles.button}>
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  content: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    textAlign: 'center' as const,
  },
  title: {
    color: '#d32f2f',
    marginTop: 0,
  },
  message: {
    color: '#666',
    marginBottom: '1.5rem',
  },
  details: {
    textAlign: 'left' as const,
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    color: '#d32f2f',
  },
  pre: {
    overflow: 'auto',
    backgroundColor: '#f0f0f0',
    padding: '0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};
```

## useAvalon Hook

### Custom Hook for Error Reporting

Créez `src/hooks/useAvalon.ts`:

```typescript
import { useCallback, useRef } from 'react';
import { AvalonClient, ReportErrorOptions } from '../services/avalon-client';

interface UseAvalonOptions {
  componentName?: string;
  defaultLevel?: 'critical' | 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

export interface UseAvalonReturn {
  reportError: (
    error: Error | string,
    options?: Omit<ReportErrorOptions, 'metadata'> & {
      metadata?: Record<string, any>;
    }
  ) => Promise<string | null>;
  reportEventError: (
    error: Error | string,
    eventType: string,
    options?: Omit<ReportErrorOptions, 'metadata'> & {
      metadata?: Record<string, any>;
    }
  ) => Promise<string | null>;
  avalon: AvalonClient;
}

/**
 * Hook for reporting errors to Avalon
 * @param avalon - AvalonClient instance
 * @param options - Configuration options
 * @returns Object with error reporting methods
 */
export function useAvalon(
  avalon: AvalonClient,
  options: UseAvalonOptions = {}
): UseAvalonReturn {
  const { componentName = 'Unknown', defaultLevel = 'error' } = options;
  const componentRef = useRef(componentName);

  const reportError = useCallback(
    async (
      error: Error | string,
      opts: Omit<ReportErrorOptions, 'metadata'> & {
        metadata?: Record<string, any>;
      } = {}
    ): Promise<string | null> => {
      return avalon.reportReactError(error, componentRef.current, {
        level: opts.level || defaultLevel,
        path: opts.path,
        method: opts.method,
        metadata: {
          ...opts.metadata,
        },
      });
    },
    [avalon, defaultLevel]
  );

  const reportEventError = useCallback(
    async (
      error: Error | string,
      eventType: string,
      opts: Omit<ReportErrorOptions, 'metadata'> & {
        metadata?: Record<string, any>;
      } = {}
    ): Promise<string | null> => {
      return avalon.reportEventError(error, eventType, {
        level: opts.level || defaultLevel,
        path: opts.path,
        method: opts.method,
        metadata: {
          ...opts.metadata,
          component: componentRef.current,
        },
      });
    },
    [avalon, defaultLevel]
  );

  return {
    reportError,
    reportEventError,
    avalon,
  };
}
```

## Context Provider

### AvalonContext and Provider

Créez `src/context/AvalonContext.tsx`:

```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { AvalonClient } from '../services/avalon-client';

interface AvalonContextType {
  avalon: AvalonClient | null;
}

const AvalonContext = createContext<AvalonContextType>({
  avalon: null,
});

export interface AvalonProviderProps {
  avalon: AvalonClient;
  children: ReactNode;
}

/**
 * Provider component for Avalon client
 * Wrap your app or a subtree with this provider to access Avalon throughout the component tree
 */
export function AvalonProvider({
  avalon,
  children,
}: AvalonProviderProps): JSX.Element {
  return (
    <AvalonContext.Provider value={{ avalon }}>
      {children}
    </AvalonContext.Provider>
  );
}

/**
 * Hook to access Avalon from context
 * Must be used within an AvalonProvider
 */
export function useAvalonContext(): AvalonClient {
  const context = useContext(AvalonContext);

  if (!context.avalon) {
    throw new Error(
      'useAvalonContext must be used within an AvalonProvider. ' +
      'Make sure to wrap your component tree with <AvalonProvider>'
    );
  }

  return context.avalon;
}
```

## Integration with Popular Libraries

### React Query Integration

Créez `src/hooks/useAvalonReactQuery.ts`:

```typescript
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { getAvalon } from '../services/avalon-client';

interface UseAvalonQueryOptions {
  componentName?: string;
  reportErrors?: boolean;
}

/**
 * Hook to automatically report React Query errors to Avalon
 */
export function useAvalonQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options: UseAvalonQueryOptions = {}
): UseQueryResult<T, unknown> {
  const { componentName = 'ReactQuery', reportErrors = true } = options;
  const avalon = getAvalon();

  const query = useQuery({
    queryKey,
    queryFn,
    retry: 1,
    meta: {
      onError: (error: unknown) => {
        if (reportErrors) {
          const err = error instanceof Error ? error : new Error(String(error));
          avalon.reportReactError(err, componentName, {
            level: 'warning',
            metadata: {
              queryKey: JSON.stringify(queryKey),
              context: 'react-query-error',
            },
          }).catch(console.error);
        }
      },
    },
  } as any);

  return query;
}

/**
 * Hook to automatically report React Query mutations errors to Avalon
 */
export function useAvalonMutation<TData, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseAvalonQueryOptions = {}
) {
  const { componentName = 'ReactQuery', reportErrors = true } = options;
  const avalon = getAvalon();

  return useMutation({
    mutationFn,
    onError: (error: TError) => {
      if (reportErrors) {
        const err = error instanceof Error ? error : new Error(String(error));
        avalon.reportReactError(err, componentName, {
          level: 'warning',
          metadata: {
            context: 'react-query-mutation-error',
            error: String(error),
          },
        }).catch(console.error);
      }
    },
  });
}
```

### Redux Integration

Créez `src/middleware/avalonMiddleware.ts`:

```typescript
import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from 'redux';
import { getAvalon } from '../services/avalon-client';

/**
 * Redux middleware to catch and report errors to Avalon
 */
export const avalonMiddleware: Middleware =
  (store: MiddlewareAPI) =>
  (next: Dispatch<AnyAction>) =>
  (action: AnyAction) => {
    const avalon = getAvalon();

    try {
      return next(action);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      avalon.reportReactError(err, 'Redux', {
        level: 'error',
        metadata: {
          action: action.type,
          payload: JSON.stringify(action.payload || {}),
          state: JSON.stringify(store.getState() || {}),
        },
      }).catch(console.error);

      throw error;
    }
  };

/**
 * Alternative: Hook-based error handling for Redux
 * Use this in components that dispatch actions
 */
export function useAvalonDispatch() {
  const avalon = getAvalon();

  return (actionCreator: any, ...args: any[]) => {
    try {
      return actionCreator(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      avalon.reportEventError(err, 'redux-dispatch', {
        level: 'error',
        metadata: {
          action: actionCreator.name,
          args: JSON.stringify(args),
        },
      }).catch(console.error);
      throw error;
    }
  };
}
```

## Event Handlers Error Catching

### Practical Examples

Créez `src/examples/EventHandlerExamples.tsx`:

```typescript
import React, { useState } from 'react';
import { useAvalon } from '../hooks/useAvalon';
import { useAvalonContext } from '../context/AvalonContext';

export function EventHandlerExamples(): JSX.Element {
  const [count, setCount] = useState(0);
  const avalon = useAvalonContext();
  const { reportEventError } = useAvalon(avalon, { componentName: 'EventHandlerExamples' });

  // Example 1: Simple click handler with error catching
  const handleButtonClick = async (): Promise<void> => {
    try {
      if (count > 10) {
        throw new Error('Count exceeded maximum value');
      }
      setCount(count + 1);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await reportEventError(err, 'button-click', {
        metadata: { count },
      });
    }
  };

  // Example 2: Form submission with validation
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;

      if (!email.includes('@')) {
        throw new Error('Invalid email format');
      }

      // Process form...
      console.log('Form submitted successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await reportEventError(err, 'form-submit', {
        metadata: {
          formName: 'email-form',
          hasEmail: !!new FormData(e.currentTarget).get('email'),
        },
      });
    }
  };

  // Example 3: Async operation in event handler
  const handleAsyncOperation = async (): Promise<void> => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Data:', data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await reportEventError(err, 'async-operation', {
        level: 'warning',
        metadata: {
          endpoint: '/api/data',
        },
      });
    }
  };

  // Example 4: Input change with validation
  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    try {
      const value = e.target.value;

      if (value.length > 100) {
        throw new Error('Input exceeds maximum length');
      }

      // Process input...
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await reportEventError(err, 'input-change', {
        metadata: {
          inputName: e.target.name,
          inputLength: e.target.value.length,
        },
      });
    }
  };

  // Example 5: Window event handlers
  React.useEffect(() => {
    const handleWindowError = async (event: ErrorEvent): Promise<void> => {
      await reportEventError(event.error, 'window-error', {
        level: 'critical',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const handleWindowUnhandledRejection = async (
      event: PromiseRejectionEvent
    ): Promise<void> => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      await reportEventError(error, 'unhandled-rejection', {
        level: 'error',
        metadata: {
          promise: String(event.promise),
        },
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleWindowUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleWindowUnhandledRejection);
    };
  }, [reportEventError]);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Event Handler Examples</h2>

      <button onClick={handleButtonClick} style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}>
        Increment Count ({count})
      </button>

      <form onSubmit={handleFormSubmit} style={{ marginTop: '1rem' }}>
        <input
          type="email"
          name="email"
          placeholder="Enter email"
          onChange={handleInputChange}
          style={{ padding: '0.5rem', marginRight: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Submit
        </button>
      </form>

      <button
        onClick={handleAsyncOperation}
        style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}
      >
        Load Data
      </button>
    </div>
  );
}
```

## Async Errors in useEffect

### Practical Hook Patterns

Créez `src/hooks/useAvalonEffect.ts`:

```typescript
import { useEffect, useRef, DependencyList } from 'react';
import { AvalonClient } from '../services/avalon-client';

interface UseAvalonEffectOptions {
  componentName?: string;
  level?: 'critical' | 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

/**
 * Hook for safely handling async operations in useEffect with automatic error reporting
 */
export function useAvalonEffect(
  avalon: AvalonClient,
  effect: () => Promise<void> | void,
  deps?: DependencyList,
  options: UseAvalonEffectOptions = {}
): void {
  const { componentName = 'Unknown', level = 'error' } = options;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    (async () => {
      try {
        await effect();
      } catch (error) {
        if (isMountedRef.current) {
          const err = error instanceof Error ? error : new Error(String(error));
          avalon.reportReactError(err, componentName, {
            level,
            metadata: {
              hook: 'useAvalonEffect',
              isMounted: isMountedRef.current,
            },
          }).catch(console.error);
        }
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, deps);
}

/**
 * Hook for fetching data with automatic error handling and reporting
 */
export interface UseFetchOptions {
  componentName?: string;
  retryCount?: number;
  retryDelay?: number;
}

export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAvalonFetch<T>(
  avalon: AvalonClient,
  url: string,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { componentName = 'Unknown', retryCount = 2, retryDelay = 1000 } = options;
  const [state, setState] = React.useState<UseFetchResult<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const isMountedRef = useRef(true);
  const retryRef = useRef(0);

  const fetchData = React.useCallback(async (retryAttempt = 0): Promise<void> => {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: T = await response.json();

      if (isMountedRef.current) {
        setState({ data, loading: false, error: null });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (retryAttempt < retryCount) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        await fetchData(retryAttempt + 1);
      } else {
        if (isMountedRef.current) {
          setState({ data: null, loading: false, error: err });

          avalon.reportReactError(err, componentName, {
            level: 'warning',
            metadata: {
              hook: 'useAvalonFetch',
              url,
              retryAttempts: retryAttempt,
              finalAttempt: true,
            },
          }).catch(console.error);
        }
      }
    }
  }, [url, componentName, retryCount, retryDelay, avalon]);

  useEffect(() => {
    isMountedRef.current = true;
    retryRef.current = 0;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return state;
}

import React from 'react';
```

### Example Component Using useAvalonEffect

```typescript
import React from 'react';
import { useAvalonEffect, useAvalonFetch } from '../hooks/useAvalonEffect';
import { useAvalonContext } from '../context/AvalonContext';

interface User {
  id: number;
  name: string;
  email: string;
}

export function UserProfileComponent(): JSX.Element {
  const avalon = useAvalonContext();
  const [userId, setUserId] = React.useState(1);

  // Example 1: Using useAvalonEffect for initialization
  useAvalonEffect(
    avalon,
    async () => {
      console.log('Component initialized');
      // Initialize analytics, etc.
    },
    [],
    { componentName: 'UserProfileComponent' }
  );

  // Example 2: Using useAvalonFetch to load user data
  const { data: user, loading, error } = useAvalonFetch<User>(
    avalon,
    `/api/users/${userId}`,
    { componentName: 'UserProfileComponent', retryCount: 3 }
  );

  // Example 3: Using useAvalonEffect with dependency changes
  useAvalonEffect(
    avalon,
    async () => {
      if (user) {
        // Perform operation based on user data
        const response = await fetch('/api/user-activity', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to track user activity');
        }
      }
    },
    [user],
    { componentName: 'UserProfileComponent', level: 'warning' }
  );

  if (loading) {
    return <div>Loading user profile...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        <p>Error loading user: {error.message}</p>
      </div>
    );
  }

  if (!user) {
    return <div>No user found</div>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <button onClick={() => setUserId(userId + 1)}>
        Load Next User
      </button>
    </div>
  );
}
```

## Production vs Development Mode

### Configuration Setup

Créez `src/config/avalon.config.ts`:

```typescript
import { initializeAvalon, AvalonClient } from '../services/avalon-client';

export interface AvalonConfig {
  collectorUrl: string;
  serviceName: string;
  isDevelopment: boolean;
  enableDevLogging: boolean;
  enableTracing: boolean;
}

let avalonConfig: AvalonConfig | null = null;
let avalonInstance: AvalonClient | null = null;

/**
 * Initialize Avalon based on environment
 */
export function setupAvalon(
  customConfig?: Partial<AvalonConfig>
): AvalonClient {
  const isProd = process.env.NODE_ENV === 'production';
  const isDev = process.env.NODE_ENV === 'development';

  const config: AvalonConfig = {
    collectorUrl: process.env.REACT_APP_AVALON_URL || 'http://localhost:4000',
    serviceName: process.env.REACT_APP_SERVICE_NAME || 'react-app',
    isDevelopment: isDev,
    enableDevLogging: isDev || process.env.REACT_APP_ENABLE_DEV_LOG === 'true',
    enableTracing: isDev || process.env.REACT_APP_ENABLE_TRACING === 'true',
    ...customConfig,
  };

  avalonConfig = config;
  avalonInstance = initializeAvalon(
    config.collectorUrl,
    config.serviceName,
    config.isDevelopment
  );

  if (config.isDevelopment) {
    console.log('Avalon initialized in DEVELOPMENT mode');
    console.log(`Collector URL: ${config.collectorUrl}`);
    console.log(`Service Name: ${config.serviceName}`);
  }

  return avalonInstance;
}

/**
 * Get Avalon configuration
 */
export function getAvalonConfig(): AvalonConfig {
  if (!avalonConfig) {
    throw new Error('Avalon has not been configured. Call setupAvalon() first.');
  }
  return avalonConfig;
}

/**
 * Get Avalon instance
 */
export function getAvalonInstance(): AvalonClient {
  if (!avalonInstance) {
    throw new Error('Avalon has not been initialized. Call setupAvalon() first.');
  }
  return avalonInstance;
}
```

### Environment Variables

Créez `.env.development`:

```bash
REACT_APP_AVALON_URL=http://localhost:4000
REACT_APP_SERVICE_NAME=react-app-dev
REACT_APP_ENABLE_DEV_LOG=true
REACT_APP_ENABLE_TRACING=true
```

Créez `.env.production`:

```bash
REACT_APP_AVALON_URL=https://avalon.example.com
REACT_APP_SERVICE_NAME=react-app
REACT_APP_ENABLE_DEV_LOG=false
REACT_APP_ENABLE_TRACING=false
```

### App Initialization

Créez ou modifiez `src/App.tsx`:

```typescript
import React, { useEffect } from 'react';
import { setupAvalon, getAvalonInstance } from './config/avalon.config';
import { AvalonProvider } from './context/AvalonContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Router } from './Router';

export function App(): JSX.Element {
  useEffect(() => {
    // Initialize Avalon once when app loads
    setupAvalon();
  }, []);

  const avalon = getAvalonInstance();

  return (
    <ErrorBoundary componentName="App">
      <AvalonProvider avalon={avalon}>
        <Router />
      </AvalonProvider>
    </ErrorBoundary>
  );
}

export default App;
```

### Mode-Specific Error Reporting

```typescript
import { getAvalonConfig, getAvalonInstance } from './config/avalon.config';

export async function reportErrorByMode(
  error: Error,
  context: string
): Promise<void> {
  const config = getAvalonConfig();
  const avalon = getAvalonInstance();

  if (config.isDevelopment) {
    // In development: Log everything to console
    console.error(`[${context}]`, error);

    // Optionally report to Avalon for testing
    if (config.enableDevLogging) {
      await avalon.reportError(error, {
        level: 'debug',
        metadata: { context, mode: 'development' },
      });
    }
  } else {
    // In production: Always report critical and error level
    const isUserFacingError = error.message.includes('User');

    await avalon.reportError(error, {
      level: isUserFacingError ? 'warning' : 'error',
      metadata: { context, mode: 'production', isUserFacing: isUserFacingError },
    });
  }
}
```

## Best Practices

### 1. Never Block Application Flow

Always wrap Avalon calls in try-catch and don't await them in critical paths:

```typescript
// Good: Fire and forget
avalon.reportError(error, { level: 'error' }).catch(console.error);

// Better: Async without blocking
setTimeout(() => {
  avalon.reportError(error, { level: 'error' }).catch(console.error);
}, 0);
```

### 2. Add Meaningful Metadata

```typescript
// Good: Provides context
await avalon.reportEventError(error, 'form-submit', {
  metadata: {
    formId: 'login-form',
    userId: currentUser?.id,
    timestamp: new Date().toISOString(),
    userAction: 'password-reset',
  },
});

// Bad: No context
await avalon.reportEventError(error, 'error');
```

### 3. Use Appropriate Error Levels

```typescript
// critical: System down, data loss risk
// fatal: Application crash
// error: Expected errors that need attention
// warning: Recoverable issues, user actions
// info: General information
// debug: Development debugging only

// Example usage:
avalon.reportError(new Error('Database connection lost'), {
  level: 'fatal',
});

avalon.reportError(new Error('Failed to load user preferences'), {
  level: 'warning',
});
```

### 4. Avoid Sensitive Data

```typescript
// Bad: Sending sensitive information
await avalon.reportError(error, {
  metadata: {
    password: form.password,
    creditCard: form.ccNumber,
    apiKey: process.env.API_KEY,
  },
});

// Good: Send safe metadata only
await avalon.reportError(error, {
  metadata: {
    formType: 'login',
    attemptNumber: 3,
    hasPassword: !!form.password,
    paymentMethodType: form.ccNumber ? 'credit_card' : 'other',
  },
});
```

### 5. Wrap Third-Party Library Errors

```typescript
import axios from 'axios';

// Wrap HTTP client
const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const avalon = getAvalonInstance();

    avalon.reportError(error, {
      level: 'warning',
      path: error.config?.url,
      method: error.config?.method,
      metadata: {
        status: error.response?.status,
        message: error.response?.data?.message,
        context: 'api-error',
      },
    }).catch(console.error);

    return Promise.reject(error);
  }
);
```

### 6. Complete Example: Full Application Setup

Créez une application complète avec tous les éléments:

```typescript
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { setupAvalon } from './config/avalon.config';
import App from './App';

// Initialize Avalon before rendering the app
setupAvalon({
  collectorUrl: process.env.REACT_APP_AVALON_URL,
  serviceName: process.env.REACT_APP_SERVICE_NAME,
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```typescript
// src/App.tsx
import React, { useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AvalonProvider } from './context/AvalonContext';
import { getAvalonInstance } from './config/avalon.config';
import MainRouter from './pages/Router';

export function App(): JSX.Element {
  const avalon = getAvalonInstance();

  useEffect(() => {
    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      avalon.reportError(event.error, {
        level: 'critical',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      }).catch(console.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      avalon.reportError(error, {
        level: 'error',
        metadata: {
          type: 'unhandledRejection',
        },
      }).catch(console.error);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [avalon]);

  return (
    <ErrorBoundary componentName="App">
      <AvalonProvider avalon={avalon}>
        <MainRouter />
      </AvalonProvider>
    </ErrorBoundary>
  );
}

export default App;
```

## Error Levels Reference

| Level      | Usage                                              | Typical Response Time |
|------------|----------------------------------------------------|-----------------------|
| `critical` | Critical error requiring immediate action          | 5-15 minutes          |
| `fatal`    | Fatal error, application unusable                  | Immediate             |
| `error`    | Standard error needing attention                   | 30-60 minutes         |
| `warning`  | Warning, recoverable issue                         | Next business day     |
| `info`     | Informational message                              | No action needed      |
| `debug`    | Debug information for development                  | Development only      |

## Recommended Metadata

```typescript
interface RecommendedMetadata {
  userId?: string;                    // Current user ID
  sessionId?: string;                 // Session identifier
  environment?: string;               // dev, staging, prod
  version?: string;                   // App version
  timestamp?: string;                 // ISO 8601 format
  component?: string;                 // React component name
  action?: string;                    // User action that caused error
  url?: string;                       // Current page URL
  userAgent?: string;                 // Browser user agent
  customData?: Record<string, any>;  // Any custom data
}
```

## Troubleshooting

### Avalon not initialized error

**Problem:** "Avalon has not been initialized"

**Solution:** Call `setupAvalon()` in your app's entry point (index.tsx or main.tsx) before rendering any components.

```typescript
// src/index.tsx
import { setupAvalon } from './config/avalon.config';

setupAvalon();
// Then render app
```

### Errors not appearing in Avalon

**Problem:** Errors are not showing up in the Avalon dashboard

**Solution:**

1. Check that the collector URL is correct
2. Verify network requests in browser DevTools
3. Check that service name is set correctly
4. Verify Avalon server is running and accessible
5. Check CORS configuration if requests are failing

### Performance impact

**Problem:** Application feels slow after integrating Avalon

**Solution:**

1. Ensure error reporting is non-blocking (fire-and-forget pattern)
2. Reduce metadata payload size
3. Use appropriate retry counts in `useAvalonFetch`
4. Consider sampling in production to reduce reporting frequency

## Summary

This guide covers:

- Installing and configuring Avalon with TypeScript
- Creating reusable Error Boundary components
- Custom hooks for error reporting
- Context-based provider pattern for app-wide access
- Integration with React Query and Redux
- Event handler and async error catching
- Development vs production configurations
- Best practices for production applications

Start with the basic setup and gradually add more sophisticated error handling as your application grows.
