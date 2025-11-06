import type { ErrorEvent, ErrorStats, ErrorLevel } from '~/types'
import { format, subDays } from 'date-fns'

export const useErrorStats = () => {
  const calculateStats = (errors: ErrorEvent[]): ErrorStats => {
    // Count by level
    const byLevel: Record<ErrorLevel, number> = {
      critical: 0,
      fatal: 0,
      error: 0,
      warning: 0,
      info: 0,
      debug: 0
    }

    // Count by service
    const byService: Record<string, number> = {}

    // Process errors
    errors.forEach(error => {
      // Count by level
      byLevel[error.level as ErrorLevel] = (byLevel[error.level as ErrorLevel] || 0) + 1

      // Count by service
      byService[error.service] = (byService[error.service] || 0) + 1
    })

    // Calculate recent trend (last 7 days)
    const recentTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')

      const count = errors.filter(error => {
        const errorDate = format(new Date(error.createdAt), 'yyyy-MM-dd')
        return errorDate === dateStr
      }).length

      recentTrend.push({
        date: format(date, 'MMM dd'),
        count
      })
    }

    return {
      total: errors.length,
      byLevel,
      byService,
      recentTrend
    }
  }

  const getTopServices = (stats: ErrorStats, limit: number = 5) => {
    return Object.entries(stats.byService)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([service, count]) => ({ service, count }))
  }

  const getCriticalCount = (stats: ErrorStats) => {
    return stats.byLevel.critical + stats.byLevel.fatal
  }

  return {
    calculateStats,
    getTopServices,
    getCriticalCount
  }
}
