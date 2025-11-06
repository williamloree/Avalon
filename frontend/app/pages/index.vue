<script setup lang="ts">
import type { ErrorEvent, ErrorStats } from "~/types";
import { formatDistanceToNow } from "date-fns";

// SEO
useHead({
  title: "Dashboard - Avalon Error Manager",
  meta: [
    {
      name: "description",
      content: "Monitor and manage your application errors",
    },
  ],
});

const { fetchErrors } = useErrorApi();
const { calculateStats, getTopServices, getCriticalCount } = useErrorStats();
const { error: showError } = useCustomToast();
const { onError, isConnected } = useWebSocket();
const { fetchApiKeys } = useApiKeys();

// State
const errors = ref<ErrorEvent[]>([]);
const stats = ref<ErrorStats | null>(null);
const apiKeys = ref<any[]>([]);
const isLoading = ref(false);
const realtimeEnabled = ref(true);
const newErrorsCount = ref(0);

// Load errors
const loadErrors = async () => {
  isLoading.value = true;
  try {
    const data = await fetchErrors({ take: 100, skip: 0 });
    errors.value = data;
    stats.value = calculateStats(data);
    newErrorsCount.value = 0;
  } catch (e: any) {
    showError("Failed to load errors: " + e.message);
  } finally {
    isLoading.value = false;
  }
};

// Load API Keys (services)
const loadApiKeys = async () => {
  try {
    const keys = await fetchApiKeys();
    apiKeys.value = keys;
  } catch (e: any) {
    console.error("Failed to load API keys:", e);
  }
};

// Gérer les nouvelles erreurs en temps réel
const handleNewError = (error: ErrorEvent) => {
  if (!realtimeEnabled.value) return;

  // Ajouter la nouvelle erreur en début de liste
  errors.value = [error, ...errors.value].slice(0, 100);

  // Recalculer les statistiques
  stats.value = calculateStats(errors.value);

  // Incrémenter le compteur de nouvelles erreurs
  newErrorsCount.value++;
};

// Services avec leurs stats
const servicesWithStats = computed(() => {
  if (!stats.value) return [];

  return apiKeys.value.map((apiKey) => {
    const errorCount = stats.value!.byService[apiKey.service] || 0;
    return {
      service: apiKey.service,
      apiKeyName: apiKey.name,
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      errorCount,
    };
  });
});

// Top services
const topServices = computed(() => {
  if (!stats.value) return [];
  return getTopServices(stats.value, 5);
});

// Critical count
const criticalCount = computed(() => {
  if (!stats.value) return 0;
  return getCriticalCount(stats.value);
});

// Load on mount
onMounted(() => {
  loadErrors();
  loadApiKeys();

  // Écouter les nouvelles erreurs via WebSocket
  const unsubscribe = onError(handleNewError);

  // Nettoyer lors du démontage
  onUnmounted(() => {
    unsubscribe();
  });
});
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Monitor your application errors in real-time
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Real-time Connection Status -->
        <div
          class="flex items-center gap-2 px-3 py-2 rounded-lg"
          :class="{
            'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300':
              isConnected,
            'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400':
              !isConnected,
          }"
        >
          <div
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-green-500 animate-pulse': isConnected,
              'bg-gray-400': !isConnected,
            }"
          ></div>
          <span class="text-sm font-medium">
            {{ isConnected ? "Live" : "Offline" }}
          </span>
        </div>

        <!-- Manual Refresh -->
        <UButton
          @click="
            loadErrors();
            loadApiKeys();
          "
          :disabled="isLoading"
          :loading="isLoading"
          icon="i-heroicons-arrow-path"
        >
          Refresh
          <UBadge
            v-if="newErrorsCount > 0"
            variant="solid"
            size="xs"
            class="ml-2"
          >
            +{{ newErrorsCount }}
          </UBadge>
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && !stats"
      class="flex items-center justify-center py-20"
    >
      <div class="text-center">
        <Icon
          name="i-heroicons-arrow-path"
          class="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4"
        />
        <p class="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="stats" class="space-y-6">
      <!-- Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Total Issues"
          :value="stats.total"
          icon="i-heroicons-exclamation-circle"
          color="blue"
          description="All time errors"
          class="animate-slide-up"
          style="animation-delay: 0s"
        />
        <MetricCard
          title="Critical Issues"
          :value="criticalCount"
          icon="i-heroicons-fire"
          color="red"
          description="Requires immediate attention"
          class="animate-slide-up"
          style="animation-delay: 0.1s; animation-fill-mode: both"
        />
        <MetricCard
          title="Configured Services"
          :value="apiKeys.length"
          icon="i-heroicons-server-stack"
          color="purple"
          description="API Keys created"
          class="animate-slide-up"
          style="animation-delay: 0.2s; animation-fill-mode: both"
        />
        <MetricCard
          title="Today's Issues"
          :value="stats.recentTrend[stats.recentTrend.length - 1]?.count || 0"
          icon="i-heroicons-calendar-days"
          color="orange"
          :trend="{
            value: 12,
            isPositive: false,
            label: 'vs yesterday',
          }"
          class="animate-slide-up"
          style="animation-delay: 0.3s; animation-fill-mode: both"
        />
      </div>

      <!-- Services Section -->
      <!-- <UCard v-if="servicesWithStats.length > 0" class="animate-fade-in" style="animation-delay: 0.1s; animation-fill-mode: both;">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="i-heroicons-server-stack" class="w-5 h-5" />
              Monitored Services
            </h3>
            <NuxtLink to="/settings/api-keys">
              <UButton variant="ghost" size="sm" icon="i-heroicons-cog-6-tooth">
                Manage
              </UButton>
            </NuxtLink>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ServiceCard
            v-for="service in servicesWithStats"
            :key="service.service"
            :service="service.service"
            :api-key-name="service.apiKeyName"
            :is-active="service.isActive"
            :last-used-at="service.lastUsedAt"
            :error-count="service.errorCount"
            :created-at="service.createdAt"
          />
        </div>

        <div v-if="servicesWithStats.length === 0" class="text-center py-12">
          <Icon name="i-heroicons-server-stack" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Services Configured</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Create API keys to start monitoring your applications
          </p>
          <NuxtLink to="/settings/api-keys">
            <UButton icon="i-heroicons-plus">
              Create API Key
            </UButton>
          </NuxtLink>
        </div>
      </UCard> -->

      <!-- Charts and Health -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 space-y-6">
          <!-- Charts Row -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ErrorChart :data="stats.recentTrend" />
            <ErrorLevelChart :data="stats.byLevel" />
          </div>

          <!-- Service Manager -->
          <UCard
            class="animate-fade-in overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-900/80"
            style="animation-delay: 0.2s; animation-fill-mode: both"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <!-- <div class="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Icon name="i-heroicons-server-stack" class="w-5 h-5 text-white" />
                  </div> -->
                  <div>
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                      Service Manager
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Monitor your applications
                    </p>
                  </div>
                </div>
                <NuxtLink to="/services">
                  <UButton
                    size="sm"
                    color="primary"
                    icon="i-heroicons-plus"
                    class="shadow-lg shadow-blue-500/30"
                  >
                    Add Service
                  </UButton>
                </NuxtLink>
              </div>
            </template>
            <div class="space-y-3">
              <div
                v-for="(service, index) in servicesWithStats.slice(0, 5)"
                :key="service.service"
                class="group relative overflow-hidden"
                :style="`animation-delay: ${0.1 * index}s`"
              >
                <!-- Background Gradient Effect -->
                <!-- <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div> -->

                <!-- Animated Border -->
                <!-- <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur-sm transition-all duration-500"></div> -->

                <div
                  class="relative bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 hover:border-transparent hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-purple-500/20 transition-all duration-500"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-4 flex-1 min-w-0">
                      <!-- Service Icon & Status -->
                      <div class="relative group/icon">
                        <div
                          class="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-blue-500/30 group-hover/icon:shadow-2xl group-hover/icon:shadow-purple-500/40 transition-all duration-500 group-hover/icon:scale-110 group-hover/icon:rotate-6"
                        >
                          {{ service.service.slice(0, 2).toUpperCase() }}
                        </div>
                        <!-- Animated Status Indicator -->
                        <div
                          class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white dark:border-gray-900 shadow-lg"
                          :class="
                            service.isActive
                              ? 'bg-green-500 animate-pulse'
                              : 'bg-gray-400'
                          "
                        >
                          <div
                            v-if="service.isActive"
                            class="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"
                          ></div>
                        </div>
                      </div>

                      <!-- Service Info -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-2">
                          <h4
                            class="font-bold text-base text-gray-900 dark:text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300"
                          >
                            {{ service.service }}
                          </h4>
                          <p
                            class="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5"
                          >
                            <!-- <Icon name="i-heroicons-key" class="w-3 h-3" /> -->
                            {{ service.apiKeyName }}
                          </p>
                          <UBadge
                            :color="service.isActive ? 'secondary' : 'neutral'"
                            size="xs"
                            class="animate-fade-in shadow-md"
                          >
                            <div class="flex items-center gap-1">
                              <div
                                class="w-1.5 h-1.5 rounded-full"
                                :class="
                                  service.isActive
                                    ? 'bg-green-400'
                                    : 'bg-gray-400'
                                "
                              ></div>
                              {{ service.isActive ? "Active" : "Inactive" }}
                            </div>
                          </UBadge>
                        </div>

                        <!-- Stats Row with Icons -->
                        <div class="flex items-center gap-4 text-xs">
                          <div
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                          >
                            <Icon
                              name="i-heroicons-exclamation-triangle"
                              class="w-4 h-4 text-red-500"
                            />
                            <span
                              class="font-bold text-red-600 dark:text-red-400"
                              >{{ service.errorCount }}</span
                            >
                            <span class="text-red-600/70 dark:text-red-400/70"
                              >errors</span
                            >
                          </div>
                          <div
                            v-if="service.lastUsedAt"
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                          >
                            <Icon
                              name="i-heroicons-clock"
                              class="w-4 h-4 text-gray-400"
                            />
                            <span class="text-gray-600 dark:text-gray-400">
                              {{
                                formatDistanceToNow(
                                  new Date(service.lastUsedAt),
                                  { addSuffix: true }
                                )
                              }}
                            </span>
                          </div>
                        </div>

                        <!-- Enhanced Progress Bar -->
                        <!-- <div class="relative">
                          <div class="flex items-center justify-between mb-1.5">
                            <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">Error Rate</span>
                            <span class="text-xs font-bold" :class="[
                              service.errorCount > 50 ? 'text-red-600 dark:text-red-400' :
                              service.errorCount > 20 ? 'text-orange-600 dark:text-orange-400' :
                              'text-blue-600 dark:text-blue-400'
                            ]">
                              {{ Math.min(Math.round((service.errorCount / (stats?.total || 1)) * 100), 100) }}%
                            </span>
                          </div>
                          <div class="relative w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                            <div
                              class="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                              :class="[
                                service.errorCount > 50 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                service.errorCount > 20 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                'bg-gradient-to-r from-blue-500 to-purple-600'
                              ]"
                              :style="{ width: `${Math.min((service.errorCount / (stats?.total || 1)) * 100, 100)}%` }"
                            >
                              <div class="absolute inset-0 bg-white/30 animate-pulse"></div>
                            </div>
                          </div>
                        </div> -->
                      </div>
                    </div>

                    <!-- Enhanced Actions -->
                    <div
                      class="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-4"
                    >
                      <NuxtLink :to="`/errors?search=${service.service}`">
                        <UButton
                          size="xs"
                          color="primary"
                          variant="soft"
                          icon="i-heroicons-magnifying-glass"
                          square
                          title="View Errors"
                          class="shadow-lg hover:shadow-xl hover:scale-110 transition-all cursor-pointer"
                        />
                      </NuxtLink>
                      <NuxtLink to="/services">
                        <UButton
                          size="xs"
                          color="neutral"
                          variant="soft"
                          icon="i-heroicons-cog-6-tooth"
                          square
                          title="Configure"
                          class="shadow-lg hover:shadow-xl hover:scale-110 transition-all cursor-pointer"
                        />
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="servicesWithStats.length === 0"
                class="text-center py-16"
              >
                <div
                  class="relative inline-flex items-center justify-center w-24 h-24 mb-6"
                >
                  <div
                    class="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 blur-xl animate-pulse"
                  ></div>
                  <div
                    class="relative w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center"
                  >
                    <Icon
                      name="i-heroicons-server-stack"
                      class="w-10 h-10 text-blue-500 dark:text-blue-400"
                    />
                  </div>
                </div>
                <h4
                  class="text-lg font-bold text-gray-900 dark:text-white mb-2"
                >
                  No Services Yet
                </h4>
                <p
                  class="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto"
                >
                  Start monitoring your applications by creating your first API
                  key
                </p>
                <NuxtLink to="/services">
                  <UButton
                    icon="i-heroicons-plus"
                    size="lg"
                    class="shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all"
                  >
                    Create First Service
                  </UButton>
                </NuxtLink>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Right Column -->
        <div class="space-y-6">
          <!-- Health Indicator -->
          <!-- <HealthIndicator
            status="healthy"
            uptime="99.9%"
            response-time="124ms"
            last-checked="2min ago"
            class="animate-slide-in-right"
            style="animation-delay: 0.1s; animation-fill-mode: both;"
          /> -->

          <!-- Recent Activity Timeline -->
          <ErrorTimeline
            :errors="errors"
            :limit="6"
            class="animate-slide-in-right"
            style="animation-delay: 0.2s; animation-fill-mode: both"
          />
        </div>
      </div>
    </div>
  </div>
</template>
