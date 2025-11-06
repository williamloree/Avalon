<script setup lang="ts">
import { formatDistanceToNow } from "date-fns";

// definePageMeta({
//   middleware: 'auth'
// });

useHead({
  title: "Releases - Avalon Error Manager",
  meta: [{ name: "description", content: "Manage releases and deployments" }],
});

// Mock data for releases
const releases = ref([
  {
    id: "1",
    version: "v2.4.1",
    environment: "production",
    status: "deployed",
    deployedAt: new Date("2024-01-28T14:30:00"),
    deployedBy: "admin",
    errorsBefore: 142,
    errorsAfter: 38,
    commitHash: "a3f2d1b",
    notes: "Fixed critical authentication bug and improved error handling",
  },
  {
    id: "2",
    version: "v2.4.0",
    environment: "production",
    status: "deployed",
    deployedAt: new Date("2024-01-25T10:15:00"),
    deployedBy: "john",
    errorsBefore: 98,
    errorsAfter: 142,
    commitHash: "b7c4e2a",
    notes: "New performance monitoring features and API improvements",
  },
  {
    id: "3",
    version: "v2.3.2",
    environment: "staging",
    status: "deployed",
    deployedAt: new Date("2024-01-27T16:45:00"),
    deployedBy: "admin",
    errorsBefore: 56,
    errorsAfter: 23,
    commitHash: "c9d1f3e",
    notes: "Bug fixes and performance improvements",
  },
  {
    id: "4",
    version: "v2.3.1",
    environment: "production",
    status: "rolled_back",
    deployedAt: new Date("2024-01-22T09:20:00"),
    deployedBy: "sarah",
    errorsBefore: 67,
    errorsAfter: 234,
    commitHash: "d4e2a1f",
    notes: "Attempted feature release - rolled back due to errors",
  },
  {
    id: "5",
    version: "v2.3.0",
    environment: "production",
    status: "deployed",
    deployedAt: new Date("2024-01-20T11:00:00"),
    deployedBy: "admin",
    errorsBefore: 89,
    errorsAfter: 67,
    commitHash: "e5f3b2c",
    notes: "Service management overhaul and UI improvements",
  },
  {
    id: "6",
    version: "v2.2.5",
    environment: "development",
    status: "deployed",
    deployedAt: new Date("2024-01-28T08:30:00"),
    deployedBy: "mike",
    errorsBefore: 12,
    errorsAfter: 8,
    commitHash: "f6a4c3d",
    notes: "Testing new error timeline features",
  },
]);

// Metrics
const metrics = computed(() => {
  const productionReleases = releases.value.filter(
    (r) => r.environment === "production"
  );
  const activeVersion =
    productionReleases.find((r) => r.status === "deployed")?.version || "N/A";
  const lastDeploy = productionReleases[0]?.deployedAt;
  const successfulDeployments = productionReleases.filter(
    (r) => r.status === "deployed"
  ).length;
  const successRate =
    productionReleases.length > 0
      ? Math.round((successfulDeployments / productionReleases.length) * 100)
      : 0;

  return {
    totalReleases: releases.value.length,
    activeVersion,
    lastDeploy: lastDeploy
      ? formatDistanceToNow(lastDeploy, { addSuffix: true })
      : "Never",
    successRate,
  };
});

// Environment badge colors
const getEnvironmentColor = (env: string) => {
  const colors: Record<string, string> = {
    production: "red",
    staging: "yellow",
    development: "blue",
  };
  return colors[env] || "gray";
};

// Status badge config
const getStatusConfig = (status: string) => {
  const configs: Record<
    string,
    { color: string; label: string; icon: string }
  > = {
    deployed: {
      color: "green",
      label: "Deployed",
      icon: "i-heroicons-check-circle",
    },
    rolled_back: {
      color: "red",
      label: "Rolled Back",
      icon: "i-heroicons-arrow-uturn-left",
    },
    failed: { color: "red", label: "Failed", icon: "i-heroicons-x-circle" },
    pending: { color: "blue", label: "Pending", icon: "i-heroicons-clock" },
  };
  return configs[status] || configs.pending;
};

// Error impact
const getErrorImpact = (before: number, after: number) => {
  const change = after - before;
  const percentage = before > 0 ? Math.round((change / before) * 100) : 0;
  return {
    change,
    percentage,
    isImprovement: change < 0,
  };
};

// Sort releases by date
const sortedReleases = computed(() => {
  return [...releases.value].sort(
    (a, b) => b.deployedAt.getTime() - a.deployedAt.getTime()
  );
});

// Deployment stats for chart
const deploymentStats = computed(() => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      successful: Math.floor(Math.random() * 5),
      failed: Math.floor(Math.random() * 2),
    };
  });
  return last7Days;
});

const maxDeployments = computed(() => {
  return Math.max(
    ...deploymentStats.value.map((s) => s.successful + s.failed),
    1
  );
});
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Releases
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track deployments and version history
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UButton
            icon="i-heroicons-arrow-down-tray"
            color="neutral"
            variant="soft"
          >
            Export
          </UButton>
          <UButton icon="i-heroicons-rocket-launch" color="primary">
            New Release
          </UButton>
        </div>
      </div>

      <!-- Metrics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Releases -->
        <UCard
          class="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Releases
              </p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {{ metrics.totalReleases }}
              </p>
              <div class="flex items-center gap-1 mt-2">
                <Icon
                  name="i-heroicons-arrow-trending-up"
                  class="w-4 h-4 text-green-600"
                />
                <span class="text-sm text-green-600 font-medium"
                  >12% this month</span
                >
              </div>
            </div>
            <div
              class="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
            >
              <Icon name="i-heroicons-rocket-launch" class="w-7 h-7" />
            </div>
          </div>
        </UCard>

        <!-- Active Version -->
        <UCard
          class="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Version
              </p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {{ metrics.activeVersion }}
              </p>
              <div class="flex items-center gap-1 mt-2">
                <div
                  class="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                ></div>
                <span class="text-sm text-gray-600 dark:text-gray-400"
                  >Production</span
                >
              </div>
            </div>
            <div
              class="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
            >
              <Icon name="i-heroicons-check-badge" class="w-7 h-7" />
            </div>
          </div>
        </UCard>

        <!-- Last Deployment -->
        <UCard
          class="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Last Deployment
              </p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {{ metrics.lastDeploy }}
              </p>
              <div class="flex items-center gap-1 mt-2">
                <Icon name="i-heroicons-clock" class="w-4 h-4 text-blue-600" />
                <span class="text-sm text-blue-600 font-medium"
                  >On schedule</span
                >
              </div>
            </div>
            <div
              class="w-14 h-14 rounded-2xl bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
            >
              <Icon name="i-heroicons-calendar" class="w-7 h-7" />
            </div>
          </div>
        </UCard>

        <!-- Success Rate -->
        <UCard
          class="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Success Rate
              </p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {{ metrics.successRate }}%
              </p>
              <div class="flex items-center gap-1 mt-2">
                <Icon
                  name="i-heroicons-arrow-trending-up"
                  class="w-4 h-4 text-green-600"
                />
                <span class="text-sm text-green-600 font-medium"
                  >+5% vs last month</span
                >
              </div>
            </div>
            <div
              class="w-14 h-14 rounded-2xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
            >
              <Icon name="i-heroicons-chart-bar" class="w-7 h-7" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Deployment Trend Chart -->
      <UCard>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Deployment Trend
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Last 7 days deployment activity
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-end justify-between gap-4 h-64">
            <div
              v-for="stat in deploymentStats"
              :key="stat.date"
              class="flex-1 flex flex-col items-center gap-2"
            >
              <div
                class="w-full flex flex-col items-center gap-1 h-full justify-end"
              >
                <!-- Successful deployments -->
                <div
                  v-if="stat.successful > 0"
                  class="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t hover:from-green-600 hover:to-green-500 transition-all cursor-pointer relative group"
                  :style="{
                    height: `${(stat.successful / maxDeployments) * 100}%`,
                  }"
                >
                  <div
                    class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
                  >
                    {{ stat.successful }} successful
                  </div>
                </div>
                <!-- Failed deployments -->
                <div
                  v-if="stat.failed > 0"
                  class="w-full bg-gradient-to-t from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 transition-all cursor-pointer relative group"
                  :style="{
                    height: `${(stat.failed / maxDeployments) * 100}%`,
                    borderRadius:
                      stat.successful > 0 ? '0' : '0.375rem 0.375rem 0 0',
                  }"
                >
                  <div
                    class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
                  >
                    {{ stat.failed }} failed
                  </div>
                </div>
              </div>
              <span
                class="text-xs text-gray-600 dark:text-gray-400 font-medium"
                >{{ stat.date }}</span
              >
            </div>
          </div>

          <!-- Legend -->
          <div
            class="flex items-center justify-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-800"
          >
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-green-500"></div>
              <span class="text-sm text-gray-600 dark:text-gray-400"
                >Successful</span
              >
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-red-500"></div>
              <span class="text-sm text-gray-600 dark:text-gray-400"
                >Failed</span
              >
            </div>
          </div>
        </div>
      </UCard>

      <!-- Release Timeline -->
      <UCard>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Release Timeline
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete deployment history
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="release in sortedReleases"
            :key="release.id"
            class="group relative bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            <!-- Gradient overlay on hover -->
            <div
              class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            ></div>

            <div class="relative flex items-start gap-6">
              <!-- Version Badge -->
              <div class="shrink-0">
                <div
                  class="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-xl shadow-blue-500/30 group-hover:shadow-2xl group-hover:shadow-purple-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
                >
                  <div class="text-center">
                    <div class="text-xs opacity-80">v</div>
                    <div class="text-sm leading-none">
                      {{ release.version.replace("v", "") }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Release Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div class="flex items-center gap-3 mb-2">
                      <h4
                        class="text-lg font-bold text-gray-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300"
                      >
                        {{ release.version }}
                      </h4>
                      <UBadge
                        :color="getEnvironmentColor(release.environment)"
                        variant="soft"
                        size="sm"
                      >
                        {{ release.environment }}
                      </UBadge>
                      <UBadge
                        :color="getStatusConfig(release.status).color"
                        variant="soft"
                        size="sm"
                      >
                        <Icon
                          :name="getStatusConfig(release.status).icon"
                          class="w-3 h-3 mr-1"
                        />
                        {{ getStatusConfig(release.status).label }}
                      </UBadge>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ release.notes }}
                    </p>
                  </div>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-6 mb-4">
                  <div class="flex items-center gap-2">
                    <Icon
                      name="i-heroicons-user"
                      class="w-4 h-4 text-gray-400"
                    />
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{
                      release.deployedBy
                    }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon
                      name="i-heroicons-clock"
                      class="w-4 h-4 text-gray-400"
                    />
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      {{
                        formatDistanceToNow(release.deployedAt, {
                          addSuffix: true,
                        })
                      }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon
                      name="i-heroicons-code-bracket"
                      class="w-4 h-4 text-gray-400"
                    />
                    <span
                      class="text-sm font-mono text-gray-600 dark:text-gray-400"
                      >{{ release.commitHash }}</span
                    >
                  </div>
                </div>

                <!-- Error Impact -->
                <div class="flex items-center gap-4">
                  <div
                    class="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800"
                  >
                    <div class="text-center">
                      <div
                        class="text-xs text-gray-500 dark:text-gray-400 mb-1"
                      >
                        Before
                      </div>
                      <div
                        class="text-lg font-bold text-gray-900 dark:text-white"
                      >
                        {{ release.errorsBefore }}
                      </div>
                    </div>
                    <Icon
                      name="i-heroicons-arrow-right"
                      class="w-5 h-5 text-gray-400"
                    />
                    <div class="text-center">
                      <div
                        class="text-xs text-gray-500 dark:text-gray-400 mb-1"
                      >
                        After
                      </div>
                      <div
                        class="text-lg font-bold text-gray-900 dark:text-white"
                      >
                        {{ release.errorsAfter }}
                      </div>
                    </div>
                  </div>

                  <div
                    class="flex items-center gap-2 px-3 py-2 rounded-lg"
                    :class="[
                      getErrorImpact(release.errorsBefore, release.errorsAfter)
                        .isImprovement
                        ? 'bg-green-100 dark:bg-green-900/20'
                        : 'bg-red-100 dark:bg-red-900/20',
                    ]"
                  >
                    <Icon
                      :name="
                        getErrorImpact(
                          release.errorsBefore,
                          release.errorsAfter
                        ).isImprovement
                          ? 'i-heroicons-arrow-trending-down'
                          : 'i-heroicons-arrow-trending-up'
                      "
                      class="w-5 h-5"
                      :class="[
                        getErrorImpact(
                          release.errorsBefore,
                          release.errorsAfter
                        ).isImprovement
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400',
                      ]"
                    />
                    <span
                      class="text-sm font-bold"
                      :class="[
                        getErrorImpact(
                          release.errorsBefore,
                          release.errorsAfter
                        ).isImprovement
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400',
                      ]"
                    >
                      {{
                        getErrorImpact(
                          release.errorsBefore,
                          release.errorsAfter
                        ).change > 0
                          ? "+"
                          : ""
                      }}{{
                        getErrorImpact(
                          release.errorsBefore,
                          release.errorsAfter
                        ).change
                      }}
                      ({{
                        getErrorImpact(
                          release.errorsBefore,
                          release.errorsAfter
                        ).percentage
                      }}%)
                    </span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="shrink-0 flex items-center gap-2">
                <UButton
                  icon="i-heroicons-eye"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  title="View Details"
                />
                <UButton
                  v-if="release.status !== 'rolled_back'"
                  icon="i-heroicons-arrow-uturn-left"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  title="Rollback"
                />
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
