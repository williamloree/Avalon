import type { ErrorEvent, ErrorFilters } from '~/types'

export const useErrorFilters = () => {
  const filters = ref<ErrorFilters>({
    service: undefined,
    level: undefined,
    search: undefined,
    startDate: undefined,
    endDate: undefined
  })

  const filterErrors = (errors: ErrorEvent[]): ErrorEvent[] => {
    return errors.filter(error => {
      // Filter by service
      if (filters.value.service && filters.value.service !== '' && error.service !== filters.value.service) {
        return false
      }

      // Filter by level
      if (filters.value.level && filters.value.level !== '' && error.level !== filters.value.level) {
        return false
      }

      // Filter by search (message, service, or id)
      if (filters.value.search && filters.value.search.trim() !== '') {
        const searchLower = filters.value.search.toLowerCase()
        const matchMessage = error.message?.toLowerCase().includes(searchLower)
        const matchService = error.service.toLowerCase().includes(searchLower)
        const matchId = error.id.toLowerCase().includes(searchLower)

        if (!matchMessage && !matchService && !matchId) {
          return false
        }
      }

      // Filter by date range
      if (filters.value.startDate && filters.value.startDate.trim() !== '') {
        const errorDate = new Date(error.createdAt)
        const startDate = new Date(filters.value.startDate)
        if (errorDate < startDate) {
          return false
        }
      }

      if (filters.value.endDate && filters.value.endDate.trim() !== '') {
        const errorDate = new Date(error.createdAt)
        const endDate = new Date(filters.value.endDate)
        endDate.setHours(23, 59, 59, 999) // End of day
        if (errorDate > endDate) {
          return false
        }
      }

      return true
    })
  }

  const resetFilters = () => {
    filters.value = {
      service: undefined,
      level: undefined,
      search: undefined,
      startDate: undefined,
      endDate: undefined
    }
  }

  const hasActiveFilters = computed(() => {
    return !!(
      filters.value.service ||
      filters.value.level ||
      filters.value.search ||
      filters.value.startDate ||
      filters.value.endDate
    )
  })

  return {
    filters,
    filterErrors,
    resetFilters,
    hasActiveFilters
  }
}
