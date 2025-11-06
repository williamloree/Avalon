# Avalon Error Collector - Next.js Integration Guide

Complete guide for integrating Avalon error collector with Next.js applications (13+). This guide covers both App Router and Pages Router implementations with TypeScript examples.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [TypeScript Client Implementation](#typescript-client-implementation)
4. [Environment Variables](#environment-variables)
5. [App Router Integration](#app-router-integration)
6. [Pages Router Integration](#pages-router-integration)
7. [API Routes Error Handling](#api-routes-error-handling)
8. [Error Boundaries](#error-boundaries)
9. [Client-side Error Catching](#client-side-error-catching)
10. [Server-side Error Catching](#server-side-error-catching)
11. [Middleware Implementation](#middleware-implementation)
12. [Best Practices](#best-practices)

---

## Installation

### Step 1: Install Dependencies

```bash
npm install axios
# or
yarn add axios
```

### Step 2: TypeScript Types (Optional but Recommended)

If using TypeScript, ensure `@types/node` is installed:

```bash
npm install --save-dev @types/node
```

---

## Configuration

### Environment Variables Setup

Create a `.env.local` file in your Next.js project root:

```env
# Avalon Error Collector Configuration
NEXT_PUBLIC_AVALON_COLLECTOR_URL=http://localhost:4000
NEXT_PUBLIC_SERVICE_NAME=my-nextjs-app
AVALON_COLLECTOR_URL=http://localhost:4000
AVALON_SERVICE_NAME=my-nextjs-app
```

**Important Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser (use these for client-side error reporting)
- Non-prefixed variables are server-only (use these for API routes and server-side logic)
- Update `NEXT_PUBLIC_AVALON_COLLECTOR_URL` to your actual Avalon collector URL in production

---

## TypeScript Client Implementation

### Create the Avalon Client (`lib/avalon-client.ts`)

```typescript
export type ErrorLevel = 'critical' | 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorContext {
  message: string;
  stack?: string;
  path?: string;
  method?: string;
}

export interface ErrorReportOptions {
  level?: ErrorLevel;
  path?: string;
  method?: string;
  metadata?: Record<string, any>;
}

export interface ErrorPayload {
  service: string;
  error: {
    message: string;
    stack: string;
    path: string | null;
    method: string | null;
  };
  level: ErrorLevel;
  metadata: Record<string, any>;
}

export interface ApiResponse {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
}

export class AvalonClient {
  private collectorUrl: string;
  private serviceName: string;
  private timeout: number = 5000;

  constructor(collectorUrl: string, serviceName: string) {
    this.collectorUrl = collectorUrl.replace(/\/$/, '');
    this.serviceName = serviceName;
  }

  /**
   * Report an error to Avalon collector
   * @param error - The error object or string
   * @param options - Error reporting options
   * @returns Error ID from collector or null if failed
   */
  async reportError(
    error: Error | string,
    options: ErrorReportOptions = {}
  ): Promise<string | null> {
    const {
      level = 'error',
      path = null,
      method = null,
      metadata = {}
    } = options;

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : new Error().stack;

    const payload: ErrorPayload = {
      service: this.serviceName,
      error: {
        message,
        stack: stack || '',
        path,
        method
      },
      level,
      metadata
    };

    return this.send(payload);
  }

  /**
   * Send error payload to collector
   */
  private async send(payload: ErrorPayload): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.collectorUrl}/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Avalon error: HTTP ${response.status}`);
        return null;
      }

      const data: ApiResponse = await response.json();
      return data.id || null;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error('Avalon request timeout');
      } else {
        console.error('Failed to report error to Avalon:', err.message);
      }
      return null;
    }
  }
}

/**
 * Singleton instance for client-side error reporting
 */
export const createAvalonClient = () => {
  const url = process.env.NEXT_PUBLIC_AVALON_COLLECTOR_URL;
  const service = process.env.NEXT_PUBLIC_SERVICE_NAME;

  if (!url || !service) {
    console.warn('Avalon client not configured');
    return null;
  }

  return new AvalonClient(url, service);
};

/**
 * Singleton instance for server-side error reporting
 */
export const createServerAvalonClient = () => {
  const url = process.env.AVALON_COLLECTOR_URL;
  const service = process.env.AVALON_SERVICE_NAME;

  if (!url || !service) {
    console.warn('Avalon server client not configured');
    return null;
  }

  return new AvalonClient(url, service);
};
```

### Create Client Singleton (`lib/avalon.ts`)

```typescript
import { createAvalonClient, createServerAvalonClient } from './avalon-client';

// Client-side singleton
let clientInstance: ReturnType<typeof createAvalonClient> | null = null;

export const getAvalonClient = () => {
  if (typeof window === 'undefined') {
    // Server-side
    return createServerAvalonClient();
  }

  // Client-side
  if (!clientInstance) {
    clientInstance = createAvalonClient();
  }
  return clientInstance;
};

// Server-side singleton
let serverInstance: ReturnType<typeof createServerAvalonClient> | null = null;

export const getServerAvalonClient = () => {
  if (!serverInstance) {
    serverInstance = createServerAvalonClient();
  }
  return serverInstance;
};
```

---

## App Router Integration

### Example 1: App Router with Client Component Error Boundary

**File: `app/components/error-boundary.tsx`**

```typescript
'use client';

import { ReactNode, useEffect } from 'react';
import { getAvalonClient } from '@/lib/avalon';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const client = getAvalonClient();

    if (client) {
      await client.reportError(error, {
        level: 'error',
        path: window.location.pathname,
        metadata: {
          componentStack: errorInfo.componentStack,
          type: 'ErrorBoundary'
        }
      });
    }

    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: '20px', border: '1px solid red' }}>
            <h2>Something went wrong</h2>
            <p>An error has been logged and our team will investigate.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### Example 2: App Router Error Handler

**File: `app/error.tsx`**

```typescript
'use client';

import { useEffect } from 'react';
import { getAvalonClient } from '@/lib/avalon';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const client = getAvalonClient();

    if (client) {
      client.reportError(error, {
        level: 'error',
        path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        metadata: {
          type: 'NextJS Error Page',
          digest: error.digest
        }
      });
    }
  }, [error]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Something went wrong!</h2>
      <button
        onClick={() => reset()}
        style={{ padding: '10px 20px', cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}
```

### Example 3: App Router Global Error Handler

**File: `app/global-error.tsx`**

```typescript
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Note: Global error runs in client but can't use hooks directly
    // Send to API route instead
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        type: 'GlobalError',
        digest: error.digest
      })
    }).catch(console.error);
  }, [error]);

  return (
    <html>
      <body>
        <h2>Global Error</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

### Example 4: App Router Server Component with Error Handling

**File: `app/dashboard/page.tsx`**

```typescript
import { getServerAvalonClient } from '@/lib/avalon';

async function fetchUserData(userId: string) {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Report server-side error
    const client = getServerAvalonClient();
    if (client && error instanceof Error) {
      await client.reportError(error, {
        level: 'error',
        path: '/dashboard',
        method: 'GET',
        metadata: {
          userId,
          type: 'fetch_failure'
        }
      });
    }

    throw error;
  }
}

export default async function DashboardPage() {
  try {
    const user = await fetchUserData('123');

    return (
      <div>
        <h1>Dashboard</h1>
        <p>Welcome, {user.name}</p>
      </div>
    );
  } catch (error) {
    // The error.tsx file will handle this
    throw error;
  }
}
```

### Example 5: App Router Client Component with Error Handling

**File: `app/components/user-list.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getAvalonClient } from '@/lib/avalon';

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const avalon = getAvalonClient();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const data: User[] = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error.message);

        // Report to Avalon
        if (avalon) {
          await avalon.reportError(error, {
            level: 'error',
            path: '/components/user-list',
            metadata: {
              component: 'UserList',
              action: 'fetchUsers'
            }
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [avalon]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Pages Router Integration

### Example 1: Pages Router Error Handling

**File: `pages/_app.tsx`**

```typescript
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { getAvalonClient } from '@/lib/avalon';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const client = getAvalonClient();

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (client) {
        client.reportError(
          new Error(String(event.reason)),
          {
            level: 'error',
            path: window.location.pathname,
            metadata: {
              type: 'unhandledRejection'
            }
          }
        );
      }
    };

    // Handle runtime errors
    const handleError = (event: ErrorEvent) => {
      if (client) {
        client.reportError(event.error || new Error(event.message), {
          level: 'error',
          path: window.location.pathname,
          metadata: {
            type: 'globalError',
            lineno: event.lineno,
            colno: event.colno,
            filename: event.filename
          }
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

### Example 2: Pages Router Page with Error Handling

**File: `pages/products/[id].tsx`**

```typescript
import { GetServerSideProps } from 'next';
import { getServerAvalonClient } from '@/lib/avalon';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Props {
  product: Product;
}

export default function ProductPage({ product }: Props) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>Price: ${product.price}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { id } = context.params as { id: string };
  const client = getServerAvalonClient();

  try {
    const response = await fetch(`https://api.example.com/products/${id}`);

    if (!response.ok) {
      throw new Error(`Product not found: ${response.status}`);
    }

    const product: Product = await response.json();

    return {
      props: { product },
      revalidate: 60
    };
  } catch (error) {
    if (client && error instanceof Error) {
      await client.reportError(error, {
        level: 'error',
        path: `/products/${id}`,
        method: 'GET',
        metadata: {
          productId: id,
          type: 'getServerSideProps'
        }
      });
    }

    return {
      notFound: true
    };
  }
};
```

### Example 3: Pages Router Custom Error Page

**File: `pages/_error.tsx`**

```typescript
import { NextPage } from 'next';
import { useEffect } from 'react';
import { getAvalonClient } from '@/lib/avalon';

interface Props {
  statusCode: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

const ErrorPage: NextPage<Props> = ({ statusCode, err }) => {
  useEffect(() => {
    if (err) {
      const client = getAvalonClient();
      if (client) {
        client.reportError(err, {
          level: statusCode >= 500 ? 'error' : 'warning',
          path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          metadata: {
            statusCode,
            type: 'CustomErrorPage'
          }
        });
      }
    }
  }, [err, statusCode]);

  return (
    <div>
      <h1>{statusCode} Error</h1>
      <p>
        {statusCode === 404
          ? 'Page not found'
          : 'An error occurred on the server'}
      </p>
    </div>
  );
};

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, err };
};

export default ErrorPage;
```

---

## API Routes Error Handling

### Example 1: Simple API Route with Error Handling

**File: `pages/api/users.ts`**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerAvalonClient } from '@/lib/avalon';

interface ApiError {
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = getServerAvalonClient();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Simulate data fetching
    const users = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' }
    ];

    res.status(200).json(users);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (client) {
      await client.reportError(err, {
        level: 'error',
        path: '/api/users',
        method: req.method,
        metadata: {
          query: req.query,
          type: 'api_error'
        }
      });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
}
```

### Example 2: API Route with Middleware Pattern

**File: `pages/api/middleware/with-avalon.ts`**

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerAvalonClient } from '@/lib/avalon';

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Wraps API handler with Avalon error reporting
 */
export function withAvalon(handler: ApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const client = getServerAvalonClient();

    try {
      await handler(req, res);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (client) {
        await client.reportError(err, {
          level: 'error',
          path: req.url || 'unknown',
          method: req.method,
          metadata: {
            query: req.query,
            cookies: req.cookies,
            type: 'api_handler_error'
          }
        });
      }

      if (!res.headersSent) {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  };
}
```

**Usage: `pages/api/posts.ts`**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAvalon } from './middleware/with-avalon';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  // This could throw and will be caught by withAvalon
  const posts = await fetchPostsFromDatabase();
  res.status(200).json(posts);
}

export default withAvalon(handler);
```

### Example 3: API Route Catch Handler

**File: `pages/api/errors.ts`**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerAvalonClient } from '@/lib/avalon';

interface ClientErrorPayload {
  message: string;
  stack?: string;
  path?: string;
  type?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = getServerAvalonClient();
  const payload = req.body as ClientErrorPayload;

  try {
    if (!payload.message) {
      return res.status(400).json({ message: 'Missing error message' });
    }

    const error = new Error(payload.message);
    error.stack = payload.stack;

    if (client) {
      const id = await client.reportError(error, {
        level: 'error',
        path: payload.path || 'unknown',
        metadata: {
          type: payload.type || 'client_error',
          userAgent: req.headers['user-agent']
        }
      });

      return res.status(200).json({
        status: 'ok',
        id
      });
    }

    res.status(500).json({ message: 'Error collector not configured' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to report error' });
  }
}
```

---

## Error Boundaries

### Example 1: Basic Error Boundary (Class Component)

**File: `app/components/error-boundary-basic.tsx`**

```typescript
'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { getAvalonClient } from '@/lib/avalon';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class BasicErrorBoundary extends React.Component<Props, State> {
  private avalon = getAvalonClient();

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);

    if (this.avalon) {
      this.avalon.reportError(error, {
        level: 'error',
        path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        metadata: {
          componentStack: errorInfo.componentStack
        }
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', border: '1px solid #ff6b6b', borderRadius: '4px' }}>
          <h2 style={{ color: '#ff6b6b' }}>Something went wrong</h2>
          <p>The error has been reported to our team.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Example 2: Custom Error Boundary with Retry Logic

**File: `app/components/error-boundary-with-retry.tsx`**

```typescript
'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { getAvalonClient } from '@/lib/avalon';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class ErrorBoundaryWithRetry extends React.Component<Props, State> {
  private avalon = getAvalonClient();
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.avalon) {
      this.avalon.reportError(error, {
        level: 'error',
        metadata: {
          componentStack: errorInfo.componentStack,
          retryCount: this.state.retryCount
        }
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prev => ({
        hasError: false,
        error: null,
        retryCount: prev.retryCount + 1
      }));
    } else {
      if (this.avalon && this.state.error) {
        this.avalon.reportError(this.state.error, {
          level: 'critical',
          metadata: {
            message: 'Max retries exceeded',
            maxRetries: this.maxRetries
          }
        });
      }
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div style={{ padding: '20px' }}>
          <h2>Error</h2>
          <p>{this.state.error.message}</p>
          <p>
            Retry attempts: {this.state.retryCount} / {this.maxRetries}
          </p>
          {this.state.retryCount < this.maxRetries && (
            <button onClick={this.handleRetry}>Try again</button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Example 3: Segment-specific Error Boundary

**File: `app/dashboard/layout.tsx`**

```typescript
import { ReactNode } from 'react';
import { ErrorBoundary } from '@/app/components/error-boundary';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div style={{ padding: '20px' }}>
          <h2>Dashboard Error</h2>
          <p>Failed to load dashboard. Please refresh the page.</p>
        </div>
      }
    >
      <div className="dashboard-layout">{children}</div>
    </ErrorBoundary>
  );
}
```

---

## Client-side Error Catching

### Example 1: Global Error Handler Setup

**File: `lib/error-handlers.ts`**

```typescript
import { getAvalonClient } from './avalon';

/**
 * Setup global error handlers for client-side errors
 */
export function setupGlobalErrorHandlers() {
  const client = getAvalonClient();

  if (!client) {
    console.warn('Avalon client not available');
    return;
  }

  // Handle uncaught errors
  window.addEventListener('error', (event: ErrorEvent) => {
    client.reportError(event.error || new Error(event.message), {
      level: 'error',
      path: window.location.pathname,
      metadata: {
        type: 'global_error',
        lineno: event.lineno,
        colno: event.colno,
        filename: event.filename
      }
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    client.reportError(error, {
      level: 'error',
      path: window.location.pathname,
      metadata: {
        type: 'unhandled_rejection'
      }
    });
  });
}
```

### Example 2: React Hook for Error Catching

**File: `hooks/use-error-handler.ts`**

```typescript
'use client';

import { useCallback } from 'react';
import { getAvalonClient } from '@/lib/avalon';
import type { ErrorReportOptions } from '@/lib/avalon-client';

/**
 * Hook for catching and reporting errors
 */
export function useErrorHandler() {
  const client = getAvalonClient();

  const handleError = useCallback(
    async (error: Error | string, options: ErrorReportOptions = {}) => {
      const err = error instanceof Error ? error : new Error(error);

      if (client) {
        const id = await client.reportError(err, {
          path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          ...options
        });

        return id;
      }

      console.error('Avalon client not available', err);
      return null;
    },
    [client]
  );

  return { handleError };
}
```

**Usage Example:**

```typescript
'use client';

import { useErrorHandler } from '@/hooks/use-error-handler';

export function MyComponent() {
  const { handleError } = useErrorHandler();

  const handleSubmit = async (formData: FormData) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      // Handle success
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await handleError(err, {
        level: 'error',
        metadata: {
          action: 'form_submission'
        }
      });
    }
  };

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Example 3: Fetch Wrapper with Error Reporting

**File: `lib/fetch-with-avalon.ts`**

```typescript
import { getAvalonClient } from './avalon';
import type { ErrorReportOptions } from './avalon-client';

export interface FetchOptions extends RequestInit {
  avalonOptions?: ErrorReportOptions;
  timeout?: number;
}

/**
 * Fetch wrapper that automatically reports errors to Avalon
 */
export async function fetchWithAvalon(
  url: string,
  options: FetchOptions = {}
) {
  const {
    avalonOptions = {},
    timeout = 10000,
    ...fetchOptions
  } = options;

  const client = getAvalonClient();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${url}`
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    const err = error instanceof Error ? error : new Error(String(error));

    if (client) {
      await client.reportError(err, {
        path: url,
        method: (fetchOptions.method || 'GET').toUpperCase(),
        ...avalonOptions
      });
    }

    throw error;
  }
}

// Usage
export async function getUser(id: string) {
  const response = await fetchWithAvalon(`/api/users/${id}`, {
    method: 'GET',
    avalonOptions: {
      level: 'error',
      metadata: { userId: id }
    }
  });

  return response.json();
}
```

---

## Server-side Error Catching

### Example 1: API Route with Comprehensive Error Handling

**File: `pages/api/data.ts`**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerAvalonClient } from '@/lib/avalon';

interface SuccessResponse {
  status: 'success';
  data: any;
}

interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  const client = getServerAvalonClient();

  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });
  }

  try {
    // Your business logic here
    const data = await processData(req.query);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (client) {
      await client.reportError(err, {
        level: 'error',
        path: req.url || '/api/data',
        method: 'GET',
        metadata: {
          query: req.query,
          type: 'data_processing_error'
        }
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function processData(query: any) {
  // Your data processing logic
  return { success: true };
}
```

### Example 2: Server Component Error Handling

**File: `app/components/async-component.tsx`**

```typescript
import { getServerAvalonClient } from '@/lib/avalon';

async function fetchData() {
  const client = getServerAvalonClient();

  try {
    const response = await fetch('https://api.example.com/data', {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (client) {
      await client.reportError(err, {
        level: 'error',
        path: '/components/async-component',
        method: 'GET',
        metadata: {
          component: 'AsyncComponent',
          external_api: 'example.com'
        }
      });
    }

    throw error;
  }
}

export async function AsyncComponent() {
  const data = await fetchData();

  return (
    <div>
      <h2>Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

### Example 3: Database Error Handling

**File: `lib/db.ts`**

```typescript
import { getServerAvalonClient } from './avalon';

export class DatabaseService {
  private client = getServerAvalonClient();

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    try {
      // Your database query logic here
      return [];
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (this.client) {
        await this.client.reportError(err, {
          level: 'critical',
          path: '/db/query',
          method: 'QUERY',
          metadata: {
            sql: sql.substring(0, 200), // Truncate for safety
            paramsCount: params?.length || 0,
            type: 'database_error'
          }
        });
      }

      throw error;
    }
  }

  async transaction<T>(
    callback: () => Promise<T>
  ): Promise<T> {
    try {
      // Start transaction
      return await callback();
      // Commit transaction
    } catch (error) {
      // Rollback transaction
      const err = error instanceof Error ? error : new Error(String(error));

      if (this.client) {
        await this.client.reportError(err, {
          level: 'critical',
          metadata: {
            type: 'transaction_error'
          }
        });
      }

      throw error;
    }
  }
}

export const db = new DatabaseService();
```

---

## Middleware Implementation

### Example 1: App Router Middleware

**File: `middleware.ts`**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for tracking and handling request-level errors
 * Note: Cannot directly report to Avalon in middleware (no fetch to external URLs)
 * Instead, use an API route to report
 */
export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const response = NextResponse.next();

  // Add request ID to response headers for tracking
  response.headers.set('X-Request-ID', requestId);

  // Store request ID in request context for use in handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-Request-ID', requestId);

  return response;
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};
```

### Example 2: Error Tracking Middleware

**File: `pages/api/middleware/error-tracking.ts`**

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerAvalonClient } from '@/lib/avalon';

/**
 * Middleware for comprehensive API error tracking
 */
export function withErrorTracking(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const client = getServerAvalonClient();
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    // Override res.json to track response status
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      const duration = Date.now() - startTime;

      // Log slow requests
      if (duration > 5000 && client) {
        client.reportError(
          new Error('Slow API request'),
          {
            level: 'warning',
            path: req.url || 'unknown',
            method: req.method,
            metadata: {
              duration,
              requestId,
              statusCode: res.statusCode
            }
          }
        );
      }

      return originalJson(data);
    };

    try {
      await handler(req, res);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (client) {
        await client.reportError(err, {
          level: 'error',
          path: req.url || 'unknown',
          method: req.method,
          metadata: {
            requestId,
            query: req.query,
            duration: Date.now() - startTime
          }
        });
      }

      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}
```

---

## Best Practices

### 1. Error Levels Guide

```typescript
const errorLevels = {
  'critical': 'Immediate action required, affecting multiple users',
  'fatal': 'Application is unusable',
  'error': 'Standard error that affects functionality',
  'warning': 'Non-critical issues that should be investigated',
  'info': 'Informational messages',
  'debug': 'Debug information only'
};
```

### 2. Metadata Best Practices

```typescript
// Good: Include relevant context
const goodMetadata = {
  userId: user.id,
  sessionId: session.id,
  feature: 'user-dashboard',
  action: 'data-fetch',
  environment: process.env.NODE_ENV,
  version: process.env.NEXT_PUBLIC_APP_VERSION
};

// Avoid: Sensitive information
const badMetadata = {
  password: 'secret123', // Never!
  creditCard: '1234-5678-9012-3456', // Never!
  apiKey: process.env.SECRET_API_KEY // Never!
};
```

### 3. Performance Considerations

```typescript
// Use async reporting but don't block user interactions
export async function reportErrorNonBlocking(error: Error) {
  const client = getAvalonClient();

  if (client) {
    // Fire and forget
    client.reportError(error).catch(console.error);
  }
}

// For critical errors, wait for response
export async function reportCriticalError(error: Error) {
  const client = getAvalonClient();

  if (client) {
    try {
      await client.reportError(error, { level: 'critical' });
    } catch (err) {
      console.error('Failed to report critical error', err);
    }
  }
}
```

### 4. Avoid Duplicate Reports

```typescript
// Track which errors have been reported
const reportedErrors = new Set<string>();

function getErrorHash(error: Error): string {
  return `${error.message}-${error.stack?.split('\n')[0]}`;
}

export async function reportErrorOnce(error: Error) {
  const hash = getErrorHash(error);

  if (reportedErrors.has(hash)) {
    console.debug('Error already reported');
    return;
  }

  const client = getAvalonClient();
  if (client) {
    await client.reportError(error);
    reportedErrors.add(hash);
  }
}
```

### 5. Testing Error Reporting

```typescript
// Test error reporting in development
export function testErrorReporting() {
  const client = getAvalonClient();

  if (client && process.env.NODE_ENV === 'development') {
    const testError = new Error('This is a test error');

    client.reportError(testError, {
      level: 'info',
      metadata: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    }).then(id => {
      console.log('Test error reported with ID:', id);
    });
  }
}

// Call in your app initialization
if (typeof window !== 'undefined') {
  testErrorReporting();
}
```

### 6. Error Boundary Strategy

```typescript
// Wrap different sections with appropriate error boundaries
export function AppLayout() {
  return (
    <ErrorBoundary fallback={<RootErrorFallback />}>
      <Header />

      <ErrorBoundary fallback={<DashboardErrorFallback />}>
        <Dashboard />
      </ErrorBoundary>

      <ErrorBoundary fallback={<FooterErrorFallback />}>
        <Footer />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
```

---

## Troubleshooting

### Issue: Errors not being reported

**Solution:**
1. Check that environment variables are set correctly
2. Verify Avalon collector is running and accessible
3. Check browser console for errors
4. Ensure client is initialized before use

```typescript
// Debug: Check if client is initialized
const client = getAvalonClient();
console.log('Avalon client:', client);
```

### Issue: Sensitive data being reported

**Solution:**
1. Always sanitize error messages and stack traces
2. Never include passwords, tokens, or API keys
3. Use metadata carefully
4. Implement data scrubbing

```typescript
function sanitizeError(error: Error): Error {
  const sanitized = new Error(error.message);

  if (error.stack) {
    // Remove sensitive patterns
    sanitized.stack = error.stack
      .replace(/(?:token|password|apikey|secret|key)=([^\s&]+)/gi, '$1=***')
      .replace(/Bearer\s+\S+/gi, 'Bearer ***');
  }

  return sanitized;
}
```

### Issue: Too many error reports

**Solution:**
1. Implement error deduplication
2. Use appropriate error levels
3. Add sampling for high-frequency errors

```typescript
interface ErrorSampleConfig {
  sampleRate: number; // 0-1
}

export function shouldReportError(error: Error, config: ErrorSampleConfig = { sampleRate: 1 }): boolean {
  return Math.random() < config.sampleRate;
}
```

---

## API Reference

### AvalonClient Class

```typescript
class AvalonClient {
  constructor(collectorUrl: string, serviceName: string);

  reportError(
    error: Error | string,
    options?: ErrorReportOptions
  ): Promise<string | null>;
}
```

### ErrorReportOptions

```typescript
interface ErrorReportOptions {
  level?: ErrorLevel;           // 'critical' | 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  path?: string;                // Request path or component path
  method?: string;              // HTTP method or operation type
  metadata?: Record<string, any>; // Additional context data
}
```

### Error Payload Structure

```typescript
interface ErrorPayload {
  service: string;              // Service name from env
  error: {
    message: string;            // Error message
    stack: string;              // Stack trace
    path: string | null;        // Request/component path
    method: string | null;      // HTTP method or operation
  };
  level: ErrorLevel;            // Error severity level
  metadata: Record<string, any>; // Additional metadata
}
```

---

## Environment Variables Reference

```env
# Required for client-side error reporting
NEXT_PUBLIC_AVALON_COLLECTOR_URL=http://localhost:4000
NEXT_PUBLIC_SERVICE_NAME=my-nextjs-app

# Required for server-side error reporting
AVALON_COLLECTOR_URL=http://localhost:4000
AVALON_SERVICE_NAME=my-nextjs-app

# Optional: Application version
NEXT_PUBLIC_APP_VERSION=1.0.0

# Optional: Environment
NEXT_PUBLIC_ENVIRONMENT=development
```

---

## Complete Example Project Structure

```
nextjs-app/
├── .env.local
├── middleware.ts
├── app/
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── components/
│   │   ├── error-boundary.tsx
│   │   └── user-list.tsx
│   └── dashboard/
│       ├── layout.tsx
│       └── page.tsx
├── pages/
│   ├── _app.tsx
│   ├── _error.tsx
│   └── api/
│       ├── users.ts
│       ├── errors.ts
│       └── middleware/
│           └── with-avalon.ts
├── lib/
│   ├── avalon.ts
│   ├── avalon-client.ts
│   ├── fetch-with-avalon.ts
│   ├── error-handlers.ts
│   └── db.ts
├── hooks/
│   └── use-error-handler.ts
└── package.json
```

---

## Summary

This guide provides comprehensive coverage for integrating Avalon error collector with Next.js applications:

- **Installation & Setup**: Simple npm installation with TypeScript client
- **Both Routers**: Full support for App Router and Pages Router
- **Multiple Layers**: Client-side, server-side, API routes, and error boundaries
- **Production Ready**: Error handling patterns following Next.js best practices
- **Type Safe**: Full TypeScript support with proper interfaces
- **Flexible**: Works with any Next.js 13+ application
- **Best Practices**: Security, performance, and reliability guidelines

For more information about Avalon collector, refer to the main documentation.
