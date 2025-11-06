// Error levels with color mapping
export type ErrorLevel = 'critical' | 'fatal' | 'error' | 'warning' | 'info' | 'debug'

// Error event record from API
export interface ErrorEvent {
  id: string
  service: string
  message: string | null
  stack: string | null
  path: string | null
  method: string | null
  level: ErrorLevel
  metadata: any
  createdAt: string
}

// API Response structure
export interface ApiResponse<T = any> {
  status: 'ok' | 'error'
  message?: string
  items?: T[]
  id?: string
}

// Error payload for creating/updating errors
export interface ErrorPayload {
  service?: string
  error?: {
    message?: string
    stack?: string
    path?: string
    method?: string
  }
  metadata?: Record<string, any>
  level?: ErrorLevel
  timestamp?: string
}

// Filter options for error listing
export interface ErrorFilters {
  service?: string
  level?: ErrorLevel
  search?: string
  startDate?: string
  endDate?: string
}

// Pagination options
export interface PaginationOptions {
  take: number
  skip: number
}

// Toast notification
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// Error statistics
export interface ErrorStats {
  total: number
  byLevel: Record<ErrorLevel, number>
  byService: Record<string, number>
  recentTrend: {
    date: string
    count: number
  }[]
}

// Color configuration for error levels
export const ERROR_LEVEL_CONFIG: Record<ErrorLevel, {
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  icon: string
  label: string
}> = {
  critical: {
    color: '#DC143C',
    bgColor: 'bg-critical',
    borderColor: 'border-critical',
    textColor: 'text-critical',
    icon: 'heroicons:exclamation-triangle-20-solid',
    label: 'Critical'
  },
  fatal: {
    color: '#8B0000',
    bgColor: 'bg-fatal',
    borderColor: 'border-fatal',
    textColor: 'text-fatal',
    icon: 'heroicons:x-circle-20-solid',
    label: 'Fatal'
  },
  error: {
    color: '#FF0000',
    bgColor: 'bg-error',
    borderColor: 'border-error',
    textColor: 'text-error',
    icon: 'heroicons:exclamation-circle-20-solid',
    label: 'Error'
  },
  warning: {
    color: '#FFA500',
    bgColor: 'bg-warning',
    borderColor: 'border-warning',
    textColor: 'text-warning',
    icon: 'heroicons:exclamation-triangle-20-solid',
    label: 'Warning'
  },
  info: {
    color: '#00BFFF',
    bgColor: 'bg-info',
    borderColor: 'border-info',
    textColor: 'text-info',
    icon: 'heroicons:information-circle-20-solid',
    label: 'Info'
  },
  debug: {
    color: '#808080',
    bgColor: 'bg-debug',
    borderColor: 'border-debug',
    textColor: 'text-debug',
    icon: 'heroicons:bug-ant-20-solid',
    label: 'Debug'
  }
}
