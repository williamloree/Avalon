<script setup lang="ts">
import type { ErrorEvent } from "~/types";
import { ERROR_LEVEL_CONFIG } from "~/types";
import { formatDistanceToNow } from "date-fns";

defineProps<{
  errors: ErrorEvent[];
  limit?: number;
}>();

const getTimeAgo = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};
</script>

<template>
  <UCard class="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
    <template #header>
      <div class="flex items-center justify-between">
        <h3
          class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
        >
          <Icon name="i-heroicons-clock" class="w-5 h-5" />
          Recent Activity
        </h3>
        <NuxtLink
          to="/errors"
          class="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all
        </NuxtLink>
      </div>
    </template>

    <div class="space-y-2">
      <div
        v-for="(error, index) in errors.slice(0, limit || 5)"
        :key="error.id"
        class="relative"
      >
        <!-- Timeline icon with glow effect -->
        <!-- <div
          class="absolute -left-[13px] top-0 w-6 h-6 rounded-full border-3 border-white dark:border-gray-900 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          :class="[ERROR_LEVEL_CONFIG[error.level].bgColor]"
        >
          <Icon
            :name="ERROR_LEVEL_CONFIG[error.level].icon"
            class="w-3.5 h-3.5 text-white drop-shadow-sm"
          />
        </div> -->

        <!-- Content Card -->
        <div
          class="group cursor-pointer transition-all duration-200 hover:translate-x-1"
        >
          <div
            class="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all"
            :class="[
              error.level === 'critical' || error.level === 'fatal'
                ? 'border-l-4'
                : 'border-l-2',
              error.level === 'critical'
                ? 'border-l-red-600 bg-red-50/50 dark:bg-red-950/10'
                : '',
              error.level === 'fatal'
                ? 'border-l-red-900 bg-red-50/50 dark:bg-red-950/10'
                : '',
              error.level === 'error' ? 'border-l-red-500' : '',
              error.level === 'warning' ? 'border-l-orange-500' : '',
              error.level === 'info' ? 'border-l-blue-500' : '',
              error.level === 'debug' ? 'border-l-gray-500' : '',
            ]"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <!-- Header with badges -->
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <div
                    class="flex items-center gap-1.5 px-2 py-1 rounded-md"
                    :class="[
                      error.level === 'critical'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : '',
                      error.level === 'fatal'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : '',
                      error.level === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : '',
                      error.level === 'warning'
                        ? 'bg-orange-50 dark:bg-orange-900/20'
                        : '',
                      error.level === 'info'
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : '',
                      error.level === 'debug'
                        ? 'bg-gray-50 dark:bg-gray-800'
                        : '',
                    ]"
                  >
                    <Icon
                      :name="ERROR_LEVEL_CONFIG[error.level].icon"
                      class="w-3.5 h-3.5"
                      :class="ERROR_LEVEL_CONFIG[error.level].textColor"
                    />
                    <span
                      class="text-xs font-semibold uppercase tracking-wide"
                      :class="ERROR_LEVEL_CONFIG[error.level].textColor"
                    >
                      {{ ERROR_LEVEL_CONFIG[error.level].label }}
                    </span>
                  </div>

                  <div
                    class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700"
                  >
                    <Icon
                      name="i-heroicons-server"
                      class="w-3 h-3 text-gray-500 dark:text-gray-400"
                    />
                    <span
                      class="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {{ error.service }}
                    </span>
                  </div>
                </div>

                <!-- Error message -->
                <p
                  class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2 leading-relaxed group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                >
                  {{ error.message || "No message" }}
                </p>

                <!-- Footer with time and path -->
                <div
                  class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400"
                >
                  <div class="flex items-center gap-1">
                    <Icon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                    <span>{{ getTimeAgo(error.createdAt) }}</span>
                  </div>
                  <div
                    v-if="error.path"
                    class="flex items-center gap-1 flex-1 min-w-0"
                  >
                    <Icon
                      name="i-heroicons-code-bracket"
                      class="w-3.5 h-3.5 shrink-0"
                    />
                    <span class="truncate font-mono">{{ error.path }}</span>
                  </div>
                </div>
              </div>

              <!-- Arrow indicator -->
              <!-- <div class="shrink-0 mt-1">
                <div class="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                  <Icon
                    name="i-heroicons-arrow-right"
                    class="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                  />
                </div>
              </div> -->
            </div>
          </div>
        </div>
      </div>

      <div v-if="errors.length === 0" class="text-center py-12">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3"
        >
          <Icon name="i-heroicons-inbox" class="w-8 h-8 text-gray-400" />
        </div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          No recent activity
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Errors will appear here when they occur
        </p>
      </div>
    </div>
  </UCard>
</template>
