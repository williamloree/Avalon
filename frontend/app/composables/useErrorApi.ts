import type { ErrorEvent, ApiResponse, ErrorPayload, PaginationOptions } from '~/types'

export const useErrorApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  // Fetch errors with pagination
  const fetchErrors = async (options: PaginationOptions = { take: 50, skip: 0 }) => {
    try {
      const response = await $fetch<ApiResponse<ErrorEvent>>(`${apiBase}/errors`, {
        params: {
          take: options.take,
          skip: options.skip
        }
      })

      if (response.status === 'ok' && response.items) {
        return response.items
      }

      throw new Error(response.message || 'Failed to fetch errors')
    } catch (error: any) {
      console.error('Error fetching errors:', error)
      throw error
    }
  }

  // Report a new error
  const reportError = async (payload: ErrorPayload) => {
    try {
      const response = await $fetch<ApiResponse>(`${apiBase}/report`, {
        method: 'POST',
        body: payload
      })

      if (response.status === 'ok') {
        return response
      }

      throw new Error(response.message || 'Failed to report error')
    } catch (error: any) {
      console.error('Error reporting error:', error)
      throw error
    }
  }

  // Test endpoints for different error levels
  const testError = async (level: string) => {
    try {
      const response = await $fetch(`${apiBase}/test/${level}`)
      return response
    } catch (error: any) {
      console.error(`Error testing ${level}:`, error)
      throw error
    }
  }

  // Test all error levels
  const testAllErrors = async () => {
    try {
      const response = await $fetch(`${apiBase}/test/all`)
      return response
    } catch (error: any) {
      console.error('Error testing all levels:', error)
      throw error
    }
  }

  // Health check
  const healthCheck = async () => {
    try {
      const response = await $fetch(`${apiBase}/`)
      return response
    } catch (error: any) {
      console.error('Health check failed:', error)
      throw error
    }
  }

  // Delete a single error
  const deleteError = async (id: string) => {
    try {
      const response = await $fetch<ApiResponse>(`${apiBase}/errors/${id}`, {
        method: 'DELETE'
      })

      if (response.status === 'ok') {
        return response
      }

      throw new Error(response.message || 'Failed to delete error')
    } catch (error: any) {
      console.error('Error deleting error:', error)
      throw error
    }
  }

  // Delete all errors
  const deleteAllErrors = async () => {
    try {
      const response = await $fetch<ApiResponse>(`${apiBase}/errors`, {
        method: 'DELETE'
      })

      if (response.status === 'ok') {
        return response
      }

      throw new Error(response.message || 'Failed to delete all errors')
    } catch (error: any) {
      console.error('Error deleting all errors:', error)
      throw error
    }
  }

  // Delete errors by service
  const deleteErrorsByService = async (service: string) => {
    try {
      const response = await $fetch<ApiResponse>(`${apiBase}/errors/service/${service}`, {
        method: 'DELETE'
      })

      if (response.status === 'ok') {
        return response
      }

      throw new Error(response.message || 'Failed to delete errors by service')
    } catch (error: any) {
      console.error('Error deleting errors by service:', error)
      throw error
    }
  }

  return {
    fetchErrors,
    reportError,
    testError,
    testAllErrors,
    healthCheck,
    deleteError,
    deleteAllErrors,
    deleteErrorsByService
  }
}
