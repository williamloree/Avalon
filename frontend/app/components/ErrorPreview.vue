<script setup lang="ts">
import type { ErrorEvent } from "~/types";
import { ERROR_LEVEL_CONFIG } from "~/types";
import { format } from "date-fns";

const props = defineProps<{
  error: ErrorEvent | null;
  position?: { x: number; y: number };
  visible?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  viewFull: [ErrorEvent];
}>();

const levelConfig = computed(() =>
  props.error ? ERROR_LEVEL_CONFIG[props.error.level] : null
);

const formattedDate = computed(() => {
  if (!props.error) return "";
  return format(new Date(props.error.createdAt), "PPpp");
});

const previewStyle = computed(() => {
  if (!props.position) return {};

  // Position the preview near the cursor, but ensure it stays on screen
  const maxWidth = 500;
  const maxHeight = 600;
  const padding = 10;

  let left = props.position.x + padding;
  let top = props.position.y + padding;

  // Adjust if it would go off screen
  if (left + maxWidth > window.innerWidth) {
    left = props.position.x - maxWidth - padding;
  }

  if (top + maxHeight > window.innerHeight) {
    top = window.innerHeight - maxHeight - padding;
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
    maxWidth: `${maxWidth}px`,
    maxHeight: `${maxHeight}px`,
  };
});

const truncateStack = (stack: string | null, lines: number = 5) => {
  if (!stack) return "";
  const stackLines = stack.split("\n");
  if (stackLines.length <= lines) return stack;
  return stackLines.slice(0, lines).join("\n") + "\n... (truncated)";
};
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible && error"
        class="fixed z-50 pointer-events-auto"
        :style="previewStyle"
      >
        <UCard
          class="shadow-2xl border-2 dark:border-gray-700 overflow-hidden"
          :ui="{
            body: { padding: 'p-4' },
            header: { padding: 'p-3' },
          }"
        >
          <template #header>
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Icon
                  v-if="levelConfig"
                  :name="levelConfig.icon"
                  :class="[levelConfig.textColor]"
                  class="w-5 h-5 shrink-0"
                />
                <div class="flex items-center gap-2 flex-wrap min-w-0">
                  <UBadge
                    v-if="levelConfig"
                    :class="[levelConfig.bgColor, 'text-white']"
                    size="xs"
                  >
                    {{ levelConfig.label }}
                  </UBadge>
                  <UBadge color="neutral" size="xs">
                    {{ error.service }}
                  </UBadge>
                </div>
              </div>
              <UButton
                icon="i-heroicons-x-mark"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                @click="emit('close')"
              />
            </div>
          </template>

          <!-- Preview Content -->
          <div class="space-y-3">
            <!-- Message -->
            <div>
              <h3
                class="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2"
              >
                {{ error.message || "No message" }}
              </h3>
            </div>

            <!-- Quick Info -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div class="text-gray-500 dark:text-gray-400">Time</div>
                <div class="font-medium truncate">{{ formattedDate }}</div>
              </div>
              <div v-if="error.method">
                <div class="text-gray-500 dark:text-gray-400">Method</div>
                <UBadge color="primary" variant="soft" size="xs">
                  {{ error.method }}
                </UBadge>
              </div>
            </div>

            <!-- Path -->
            <div v-if="error.path" class="text-xs">
              <div class="text-gray-500 dark:text-gray-400 mb-1">Path</div>
              <code
                class="block text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded truncate"
              >
                {{ error.path }}
              </code>
            </div>

            <!-- Stack Preview -->
            <div v-if="error.stack" class="text-xs">
              <div class="text-gray-500 dark:text-gray-400 mb-1">
                Stack Trace (preview)
              </div>
              <pre
                class="text-xs p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-32 scrollbar-thin"
                >{{ truncateStack(error.stack) }}</pre
              >
            </div>

            <!-- Metadata indicator -->
            <div
              v-if="error.metadata && Object.keys(error.metadata).length > 0"
              class="text-xs"
            >
              <div
                class="flex items-center gap-2 text-gray-500 dark:text-gray-400"
              >
                <Icon name="i-heroicons-document-text" class="w-4 h-4" />
                <span
                  >{{ Object.keys(error.metadata).length }} metadata
                  field(s)</span
                >
              </div>
            </div>

            <!-- Action Button -->
            <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
              <UButton
                @click="emit('viewFull', error)"
                color="primary"
                variant="soft"
                size="xs"
                block
                icon="i-heroicons-eye"
              >
                View Full Details
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background: #4a5568;
}
</style>
