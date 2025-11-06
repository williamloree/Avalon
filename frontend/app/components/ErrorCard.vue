<script setup lang="ts">
import type { ErrorEvent } from "~/types";
import { ERROR_LEVEL_CONFIG } from "~/types";
import { format } from "date-fns";

const props = defineProps<{
  error: ErrorEvent;
  compact?: boolean;
}>();

const emit = defineEmits<{
  view: [ErrorEvent];
  delete: [string];
}>();

const levelConfig = computed(() => ERROR_LEVEL_CONFIG[props.error.level]);
const isExpanded = ref(false);

const formattedDate = computed(() => {
  return format(new Date(props.error.createdAt), "PPpp");
});

const truncatedMessage = computed(() => {
  if (!props.error.message) return "No message";
  if (props.error.message.length > 150) {
    return props.error.message.substring(0, 150) + "...";
  }
  return props.error.message;
});

const hasStack = computed(() => !!props.error.stack);
const hasMetadata = computed(
  () => props.error.metadata && Object.keys(props.error.metadata).length > 0
);
</script>

<template>
  <UCard
    :ui="{
      body: { padding: 'p-6' },
      base:
        'hover:shadow-lg transition-all duration-200 border-l-4 ' +
        levelConfig.borderColor,
    }"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-3">
      <div class="flex items-start gap-3 flex-1">
        <Icon
          :name="levelConfig.icon"
          :class="[levelConfig.textColor]"
          class="w-6 h-6 shrink-0 mt-0.5"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <UBadge :class="[levelConfig.bgColor, 'text-white']" size="sm">
              {{ levelConfig.label }}
            </UBadge>
            <UBadge color="neutral" size="sm">
              {{ error.service }}
            </UBadge>
            <UBadge
              v-if="error.method"
              color="primary"
              variant="soft"
              size="sm"
            >
              {{ error.method }}
            </UBadge>
          </div>
          <h3
            class="font-semibold text-gray-900 dark:text-gray-100 break-words"
          >
            {{ truncatedMessage }}
          </h3>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <UButton
          @click="emit('view', error)"
          icon="i-heroicons-eye-20-solid"
          color="neutral"
          variant="ghost"
          size="sm"
          square
        />
        <UButton
          @click="emit('delete', error.id)"
          icon="i-heroicons-trash-20-solid"
          color="red"
          variant="ghost"
          size="sm"
          square
        />
      </div>
    </div>

    <!-- Details -->
    <div class="space-y-2 text-sm">
      <div
        v-if="error.path"
        class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
      >
        <Icon name="heroicons:link-20-solid" class="w-4 h-4" />
        <code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{
          error.path
        }}</code>
      </div>

      <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Icon name="heroicons:clock-20-solid" class="w-4 h-4" />
        <span>{{ formattedDate }}</span>
      </div>

      <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Icon name="heroicons:identification-20-solid" class="w-4 h-4" />
        <code class="text-xs">{{ error.id }}</code>
      </div>

      <!-- Expandable sections -->
      <div
        v-if="hasStack && !compact"
        class="pt-2 border-t border-gray-200 dark:border-gray-700"
      >
        <UButton
          @click="isExpanded = !isExpanded"
          :icon="
            isExpanded
              ? 'i-heroicons-chevron-up-20-solid'
              : 'i-heroicons-chevron-down-20-solid'
          "
          color="neutral"
          variant="ghost"
          size="sm"
          :padded="false"
        >
          Stack Trace
        </UButton>
        <pre
          v-if="isExpanded"
          class="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto"
          >{{ error.stack }}</pre
        >
      </div>

      <div
        v-if="hasMetadata && !compact"
        class="pt-2 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Metadata
        </div>
        <pre
          class="p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto"
          >{{ JSON.stringify(error.metadata, null, 2) }}</pre
        >
      </div>
    </div>
  </UCard>
</template>
