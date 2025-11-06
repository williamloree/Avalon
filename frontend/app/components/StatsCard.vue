<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon: string
  color?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}>()
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ title }}</p>
        <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ value }}</p>
        <div v-if="trend" class="flex items-center gap-1 mt-2">
          <Icon
            :name="trend.isPositive ? 'heroicons:arrow-trending-up-20-solid' : 'heroicons:arrow-trending-down-20-solid'"
            :class="trend.isPositive ? 'text-green-500' : 'text-red-500'"
            class="w-4 h-4"
          />
          <span
            :class="trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            class="text-sm font-medium"
          >
            {{ Math.abs(trend.value) }}%
          </span>
        </div>
      </div>
      <div
        class="p-3 rounded-lg"
        :class="color || 'bg-blue-100 dark:bg-blue-900/30'"
      >
        <Icon :name="icon" class="w-6 h-6" :class="color ? 'text-white' : 'text-blue-600 dark:text-blue-400'" />
      </div>
    </div>
  </UCard>
</template>
