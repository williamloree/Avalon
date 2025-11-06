<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { ErrorLevel } from '~/types'
import { ERROR_LEVEL_CONFIG } from '~/types'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  data: Record<ErrorLevel, number>
}>()

const chartData = computed(() => {
  const levels: ErrorLevel[] = ['critical', 'fatal', 'error', 'warning', 'info', 'debug']

  return {
    labels: levels.map(level => ERROR_LEVEL_CONFIG[level].label),
    datasets: [
      {
        data: levels.map(level => props.data[level] || 0),
        backgroundColor: levels.map(level => ERROR_LEVEL_CONFIG[level].color),
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderWidth: 1
    }
  }
}
</script>

<template>
  <UCard class="animate-fade-in backdrop-blur-sm bg-white/80 dark:bg-gray-900/80" style="animation-delay: 0.1s; animation-fill-mode: both;">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Icon name="i-heroicons-chart-pie" class="w-5 h-5" />
        Errors by Level
      </h3>
    </template>
    <div class="h-80">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
  </UCard>
</template>
