export interface ErrorPayload {
  service?: string;
  error?: {
    message?: string;
    stack?: string;
    path?: string;
    method?: string;
  };
  metadata?: Record<string, any>;
  level?: string;
  timestamp?: string;
}

export interface ErrorEventRecord {
  id: string;
  service: string;
  message: string | null;
  stack: string | null;
  path: string | null;
  method: string | null;
  level: string;
  metadata: any;
  createdAt: Date;
}

export interface GetErrorsQuery {
  take?: string;
  skip?: string;
}

export interface ApiResponse<T = any> {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  items?: T[];
}
