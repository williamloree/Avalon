<script setup lang="ts">
// SEO
useHead({
  title: "Performance - Avalon Error Manager",
  meta: [
    { name: "description", content: "Monitor application performance metrics" },
  ],
});

// Mock data for performance metrics
const responseTimeData = ref([
  { time: "00:00", value: 120 },
  { time: "04:00", value: 145 },
  { time: "08:00", value: 230 },
  { time: "12:00", value: 280 },
  { time: "16:00", value: 195 },
  { time: "20:00", value: 160 },
]);

const throughputData = ref([
  { time: "00:00", requests: 1200 },
  { time: "04:00", requests: 800 },
  { time: "08:00", requests: 3500 },
  { time: "12:00", requests: 5200 },
  { time: "16:00", requests: 4100 },
  { time: "20:00", requests: 2800 },
]);

const errorRateData = ref([
  { time: "00:00", rate: 0.5 },
  { time: "04:00", rate: 0.3 },
  { time: "08:00", rate: 1.2 },
  { time: "12:00", rate: 2.1 },
  { time: "16:00", rate: 1.4 },
  { time: "20:00", rate: 0.8 },
]);

const servicesPerformance = ref([
  {
    name: "api-gateway",
    avgResponseTime: 145,
    requests: 12500,
    errorRate: 0.8,
    uptime: 99.9,
  },
  {
    name: "auth-service",
    avgResponseTime: 98,
    requests: 8200,
    errorRate: 0.3,
    uptime: 99.95,
  },
  {
    name: "payment-service",
    avgResponseTime: 320,
    requests: 3400,
    errorRate: 1.2,
    uptime: 99.7,
  },
  {
    name: "notification-service",
    avgResponseTime: 180,
    requests: 5600,
    errorRate: 0.5,
    uptime: 99.85,
  },
]);

const endpointsPerformance = ref([
  {
    endpoint: "/api/users",
    method: "GET",
    avgTime: 85,
    calls: 4500,
    p95: 120,
    p99: 180,
  },
  {
    endpoint: "/api/auth/login",
    method: "POST",
    avgTime: 145,
    calls: 2100,
    p95: 210,
    p99: 350,
  },
  {
    endpoint: "/api/orders",
    method: "POST",
    avgTime: 280,
    calls: 1800,
    p95: 420,
    p99: 680,
  },
  {
    endpoint: "/api/products",
    method: "GET",
    avgTime: 95,
    calls: 8900,
    p95: 140,
    p99: 210,
  },
  {
    endpoint: "/api/payments",
    method: "POST",
    avgTime: 520,
    calls: 950,
    p95: 780,
    p99: 1200,
  },
]);

const getPerformanceColor = (
  value: number,
  threshold: { good: number; warning: number }
) => {
  if (value <= threshold.good) return "text-green-600 dark:text-green-400";
  if (value <= threshold.warning) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
};

const getUptimeColor = (uptime: number) => {
  if (uptime >= 99.9) return "text-green-600 dark:text-green-400";
  if (uptime >= 99.5) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
};

const formatNumber = (num: number) => {
  return num.toLocaleString("en-US");
};
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Performance
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Monitor your application performance metrics and SLAs
        </p>
      </div>
      <div class="flex items-center gap-3">
        <UButton variant="ghost" icon="i-heroicons-arrow-path">
          Refresh
        </UButton>
        <UButton icon="i-heroicons-arrow-down-tray"> Export Report </UButton>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <UCard>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Avg Response Time
            </p>
            <Icon name="i-heroicons-clock" class="w-5 h-5 text-blue-500" />
          </div>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">124ms</p>
          <div class="flex items-center gap-2 text-sm">
            <span
              class="text-green-600 dark:text-green-400 flex items-center gap-1"
            >
              <Icon name="i-heroicons-arrow-trending-down" class="w-4 h-4" />
              12%
            </span>
            <span class="text-gray-500">vs last hour</span>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Throughput
            </p>
            <Icon
              name="i-heroicons-arrow-trending-up"
              class="w-5 h-5 text-purple-500"
            />
          </div>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">3.2k/s</p>
          <div class="flex items-center gap-2 text-sm">
            <span
              class="text-green-600 dark:text-green-400 flex items-center gap-1"
            >
              <Icon name="i-heroicons-arrow-trending-up" class="w-4 h-4" />
              8%
            </span>
            <span class="text-gray-500">vs last hour</span>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Error Rate
            </p>
            <Icon
              name="i-heroicons-exclamation-triangle"
              class="w-5 h-5 text-orange-500"
            />
          </div>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">0.8%</p>
          <div class="flex items-center gap-2 text-sm">
            <span
              class="text-green-600 dark:text-green-400 flex items-center gap-1"
            >
              <Icon name="i-heroicons-arrow-trending-down" class="w-4 h-4" />
              0.3%
            </span>
            <span class="text-gray-500">vs last hour</span>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Uptime
            </p>
            <Icon name="i-heroicons-signal" class="w-5 h-5 text-green-500" />
          </div>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">99.9%</p>
          <div class="flex items-center gap-2 text-sm">
            <UBadge color="green" variant="soft" size="xs">Healthy</UBadge>
            <span class="text-gray-500">30 days</span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Response Time Chart -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Response Time
            </h3>
            <UBadge color="primary" variant="soft" size="xs">Last 24h</UBadge>
          </div>
        </template>
        <div class="h-64 flex items-end justify-between gap-2">
          <div
            v-for="(point, index) in responseTimeData"
            :key="index"
            class="flex-1 flex flex-col items-center gap-2"
          >
            <div
              class="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer relative group"
              :style="{ height: `${(point.value / 300) * 100}%` }"
            >
              <div
                class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
              >
                {{ point.value }}ms
              </div>
            </div>
            <span class="text-xs text-gray-500">{{ point.time }}</span>
          </div>
        </div>
      </UCard>

      <!-- Throughput Chart -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Throughput
            </h3>
            <UBadge color="purple" variant="soft" size="xs"
              >Requests/min</UBadge
            >
          </div>
        </template>
        <div class="h-64 flex items-end justify-between gap-2">
          <div
            v-for="(point, index) in throughputData"
            :key="index"
            class="flex-1 flex flex-col items-center gap-2"
          >
            <div
              class="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t hover:from-purple-600 hover:to-purple-500 transition-all cursor-pointer relative group"
              :style="{ height: `${(point.requests / 5500) * 100}%` }"
            >
              <div
                class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
              >
                {{ formatNumber(point.requests) }}
              </div>
            </div>
            <span class="text-xs text-gray-500">{{ point.time }}</span>
          </div>
        </div>
      </UCard>

      <!-- Error Rate Chart -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Error Rate
            </h3>
            <UBadge color="orange" variant="soft" size="xs">Percentage</UBadge>
          </div>
        </template>
        <div class="h-64 flex items-end justify-between gap-2">
          <div
            v-for="(point, index) in errorRateData"
            :key="index"
            class="flex-1 flex flex-col items-center gap-2"
          >
            <div
              class="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t hover:from-orange-600 hover:to-orange-500 transition-all cursor-pointer relative group"
              :style="{ height: `${(point.rate / 2.5) * 100}%` }"
            >
              <div
                class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
              >
                {{ point.rate }}%
              </div>
            </div>
            <span class="text-xs text-gray-500">{{ point.time }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Services Performance -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3
            class="font-semibold text-gray-900 dark:text-white flex items-center gap-2"
          >
            <Icon name="i-heroicons-server-stack" class="w-5 h-5" />
            Services Performance
          </h3>
          <UButton variant="ghost" size="sm" icon="i-heroicons-funnel">
            Filter
          </UButton>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead
            class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          >
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                Service
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                Avg Response
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                Requests
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                Error Rate
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                Uptime
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="service in servicesPerformance"
              :key="service.name"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs"
                  >
                    {{ service.name.substring(0, 2).toUpperCase() }}
                  </div>
                  <span class="font-medium text-gray-900 dark:text-white">{{
                    service.name
                  }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="
                    getPerformanceColor(service.avgResponseTime, {
                      good: 150,
                      warning: 300,
                    })
                  "
                  class="font-semibold"
                >
                  {{ service.avgResponseTime }}ms
                </span>
              </td>
              <td class="px-6 py-4 text-gray-900 dark:text-white">
                {{ formatNumber(service.requests) }}
              </td>
              <td class="px-6 py-4">
                <span
                  :class="
                    getPerformanceColor(service.errorRate, {
                      good: 1,
                      warning: 2,
                    })
                  "
                  class="font-semibold"
                >
                  {{ service.errorRate }}%
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="getUptimeColor(service.uptime)"
                  class="font-semibold"
                >
                  {{ service.uptime }}%
                </span>
              </td>
              <td class="px-6 py-4">
                <UBadge
                  :color="
                    service.uptime >= 99.9
                      ? 'green'
                      : service.uptime >= 99.5
                      ? 'orange'
                      : 'red'
                  "
                  variant="soft"
                  size="sm"
                >
                  {{
                    service.uptime >= 99.9
                      ? "Healthy"
                      : service.uptime >= 99.5
                      ? "Degraded"
                      : "Critical"
                  }}
                </UBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Top Endpoints -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3
            class="font-semibold text-gray-900 dark:text-white flex items-center gap-2"
          >
            <Icon name="i-heroicons-chart-bar" class="w-5 h-5" />
            Top Endpoints by Response Time
          </h3>
          <UButton variant="ghost" size="sm" to="/services"> View All </UButton>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead
            class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          >
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                Endpoint
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                Method
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                Avg Time
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                Calls
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                P95
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
              >
                P99
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="endpoint in endpointsPerformance"
              :key="endpoint.endpoint"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="px-6 py-4">
                <span class="font-mono text-sm text-gray-900 dark:text-white">{{
                  endpoint.endpoint
                }}</span>
              </td>
              <td class="px-6 py-4">
                <UBadge
                  :color="
                    endpoint.method === 'GET'
                      ? 'blue'
                      : endpoint.method === 'POST'
                      ? 'green'
                      : 'orange'
                  "
                  variant="soft"
                  size="xs"
                >
                  {{ endpoint.method }}
                </UBadge>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="
                    getPerformanceColor(endpoint.avgTime, {
                      good: 150,
                      warning: 300,
                    })
                  "
                  class="font-semibold"
                >
                  {{ endpoint.avgTime }}ms
                </span>
              </td>
              <td class="px-6 py-4 text-gray-900 dark:text-white">
                {{ formatNumber(endpoint.calls) }}
              </td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-400">
                {{ endpoint.p95 }}ms
              </td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-400">
                {{ endpoint.p99 }}ms
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
