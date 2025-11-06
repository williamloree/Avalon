<script setup lang="ts">
import type { ErrorEvent } from "~/types";
import { ERROR_LEVEL_CONFIG } from "~/types";
import { format } from "date-fns";

const props = defineProps<{
  error: ErrorEvent | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const levelConfig = computed(() =>
  props.error ? ERROR_LEVEL_CONFIG[props.error.level] : null
);

const formattedDate = computed(() => {
  if (!props.error) return "";
  return format(new Date(props.error.createdAt), "PPpp");
});

const isModalOpen = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value) emit("close");
  },
});

const getLevelBadgeColor = (level: string): any => {
  const colorMap: Record<string, string> = {
    critical: "error",
    fatal: "error",
    error: "error",
    warning: "warning",
    info: "info",
    debug: "neutral",
  };
  return colorMap[level] || "neutral";
};
</script>

<template>
  <UModal v-model:open="isModalOpen" class="w-full">
    <template #content>
      <div v-if="error" class="p-6">
        <!-- Header -->
        <div class="flex items-start gap-4 mb-6">
          <Icon
            v-if="levelConfig"
            :name="levelConfig.icon"
            :class="[levelConfig.textColor]"
            class="w-8 h-8 shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <UBadge
                v-if="levelConfig"
                :color="getLevelBadgeColor(error.level)"
                variant="solid"
                size="sm"
              >
                {{ levelConfig.label }}
              </UBadge>
              <UBadge color="neutral" variant="soft" size="sm">
                {{ error.service }}
              </UBadge>
            </div>
            <h2
              class="text-xl font-bold text-gray-900 dark:text-white break-words"
            >
              {{ error.message || "No message" }}
            </h2>
          </div>
        </div>

        <!-- Body -->
        <div class="space-y-6 max-h-[60vh] overflow-y-auto">
          <!-- Basic info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-start gap-3">
              <Icon
                name="i-heroicons-clock"
                class="w-5 h-5 text-gray-400 mt-0.5 shrink-0"
              />
              <div class="min-w-0">
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Timestamp
                </div>
                <div class="text-sm font-medium">{{ formattedDate }}</div>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <Icon
                name="i-heroicons-identification"
                class="w-5 h-5 text-gray-400 mt-0.5 shrink-0"
              />
              <div class="min-w-0 flex-1">
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Error ID
                </div>
                <code
                  class="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block truncate"
                >
                  {{ error.id }}
                </code>
              </div>
            </div>

            <div v-if="error.method" class="flex items-start gap-3">
              <Icon
                name="i-heroicons-arrow-path"
                class="w-5 h-5 text-gray-400 mt-0.5 shrink-0"
              />
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  HTTP Method
                </div>
                <UBadge color="primary" variant="soft" size="sm">
                  {{ error.method }}
                </UBadge>
              </div>
            </div>

            <div v-if="error.path" class="flex items-start gap-3">
              <Icon
                name="i-heroicons-link"
                class="w-5 h-5 text-gray-400 mt-0.5 shrink-0"
              />
              <div class="min-w-0 flex-1">
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Path
                </div>
                <code
                  class="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block break-all"
                >
                  {{ error.path }}
                </code>
              </div>
            </div>
          </div>

          <!-- Stack trace -->
          <div v-if="error.stack" class="space-y-3">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <Icon name="i-heroicons-bug-ant" class="w-5 h-5" />
              Stack Trace
            </h3>
            <div class="relative">
              <pre
                class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs overflow-x-auto border border-gray-200 dark:border-gray-700 max-h-64"
                >{{ error.stack }}</pre
              >
            </div>
          </div>

          <!-- Metadata -->
          <div
            v-if="error.metadata && Object.keys(error.metadata).length > 0"
            class="space-y-3"
          >
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <Icon name="i-heroicons-document-text" class="w-5 h-5" />
              Metadata
            </h3>
            <div class="relative">
              <pre
                class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs overflow-x-auto border border-gray-200 dark:border-gray-700 max-h-64"
                >{{ JSON.stringify(error.metadata, null, 2) }}</pre
              >
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800"
        >
          <UButton @click="isModalOpen = false" color="neutral" variant="soft">
            Close
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
