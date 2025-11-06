<script setup lang="ts">
const props = defineProps<{
  status: 'healthy' | 'degraded' | 'down'
  uptime: string
  responseTime: string
  lastChecked?: string
}>()

const statusConfig = {
  healthy: {
    label: 'Operational',
    color: 'green',
    icon: 'i-heroicons-check-circle',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    textClass: 'text-green-700 dark:text-green-400',
    dotClass: 'bg-green-500'
  },
  degraded: {
    label: 'Degraded',
    color: 'orange',
    icon: 'i-heroicons-exclamation-triangle',
    bgClass: 'bg-orange-50 dark:bg-orange-900/20',
    textClass: 'text-orange-700 dark:text-orange-400',
    dotClass: 'bg-orange-500'
  },
  down: {
    label: 'Down',
    color: 'red',
    icon: 'i-heroicons-x-circle',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-700 dark:text-red-400',
    dotClass: 'bg-red-500'
  }
}

const config = computed(() => statusConfig[props.status])
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">System Health</h3>
        <div class="flex items-center gap-2">
          <span :class="[config.dotClass, 'w-2 h-2 rounded-full animate-pulse']"></span>
          <span :class="config.textClass" class="text-sm font-medium">
            {{ config.label }}
          </span>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Status Badge -->
      <div :class="[config.bgClass, 'p-4 rounded-lg']">
        <div class="flex items-center gap-3">
          <Icon :name="config.icon" :class="config.textClass" class="w-6 h-6" />
          <div>
            <p :class="config.textClass" class="text-sm font-semibold">
              All systems {{ config.label.toLowerCase() }}
            </p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Last checked {{ lastChecked || 'just now' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Metrics -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <p class="text-xs text-gray-500 dark:text-gray-500">Uptime</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ uptime }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-xs text-gray-500 dark:text-gray-500">Avg Response</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ responseTime }}</p>
        </div>
      </div>
    </div>
  </UCard>
</template>
