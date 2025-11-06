<script setup lang="ts">
import type { ErrorEvent } from "~/types";
import { ERROR_LEVEL_CONFIG } from "~/types";
import { formatDistanceToNow } from "date-fns";

const props = defineProps<{
  errors: ErrorEvent[];
  loading?: boolean;
  enablePreview?: boolean;
  newErrorIds?: Set<string>;
}>();

const emit = defineEmits<{
  view: [ErrorEvent];
  delete: [string];
}>();

const selectedErrors = ref<string[]>([]);
const previewError = ref<ErrorEvent | null>(null);
const previewVisible = ref(false);
const previewPosition = ref({ x: 0, y: 0 });
const previewTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const currentHoveredRow = ref<string | null>(null);

const columns = [
  {
    key: "level",
    label: "Level",
    sortable: true,
  },
  {
    key: "message",
    label: "Issue",
    sortable: false,
  },
  {
    key: "service",
    label: "Service",
    sortable: true,
  },
  {
    key: "createdAt",
    label: "Time",
    sortable: true,
  },
  {
    key: "actions",
    label: "",
  },
];

const getTimeAgo = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const getLevelBadgeColor = (level: string) => {
  const config = ERROR_LEVEL_CONFIG[level as keyof typeof ERROR_LEVEL_CONFIG];
  return config?.color || "gray";
};

const getRowBackgroundClass = (error: ErrorEvent) => {
  const level = error.level;
  const isNew = props.newErrorIds?.has(error.id);
  const baseClass = "transition-all duration-200 cursor-pointer border-l-4";
  const newClass = isNew
    ? "animate-pulse-slow bg-green-50 dark:bg-green-950/30 ring-2 ring-green-400 dark:ring-green-600"
    : "";

  let colorClass = "";
  switch (level) {
    case "critical":
      colorClass = `border-l-red-600 hover:bg-red-50 dark:hover:bg-red-950/20`;
      break;
    case "fatal":
      colorClass = `border-l-red-900 hover:bg-red-50 dark:hover:bg-red-950/20`;
      break;
    case "error":
      colorClass = `border-l-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`;
      break;
    case "warning":
      colorClass = `border-l-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20`;
      break;
    case "info":
      colorClass = `border-l-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20`;
      break;
    case "debug":
      colorClass = `border-l-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50`;
      break;
    default:
      colorClass = `border-l-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50`;
  }

  return `${baseClass} ${colorClass} ${newClass}`.trim();
};

const selectAll = (checked: boolean) => {
  if (checked) {
    selectedErrors.value = props.errors.map((e) => e.id);
  } else {
    selectedErrors.value = [];
  }
};

const isAllSelected = computed(() => {
  return (
    selectedErrors.value.length === props.errors.length &&
    props.errors.length > 0
  );
});

const deleteSelected = () => {
  selectedErrors.value.forEach((id) => emit("delete", id));
  selectedErrors.value = [];
};

// Preview functionality
const showPreview = (error: ErrorEvent, event: MouseEvent) => {
  if (!props.enablePreview) return;

  currentHoveredRow.value = error.id;

  // Clear any existing timeout
  if (previewTimeout.value) {
    clearTimeout(previewTimeout.value);
  }

  // Show preview after a short delay
  previewTimeout.value = setTimeout(() => {
    if (currentHoveredRow.value === error.id) {
      previewError.value = error;
      previewPosition.value = { x: event.clientX, y: event.clientY };
      previewVisible.value = true;
    }
  }, 500); // 500ms delay before showing preview
};

const hidePreview = () => {
  currentHoveredRow.value = null;

  if (previewTimeout.value) {
    clearTimeout(previewTimeout.value);
    previewTimeout.value = null;
  }

  previewVisible.value = false;
};

const closePreview = () => {
  hidePreview();
};

const viewFullDetails = (error: ErrorEvent) => {
  hidePreview();
  emit("view", error);
};

// Clean up timeout on unmount
onUnmounted(() => {
  if (previewTimeout.value) {
    clearTimeout(previewTimeout.value);
  }
});
</script>

<template>
  <UCard
    :ui="{
      body: { padding: '' },
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Issues
        </h3>
        <div v-if="selectedErrors.length > 0" class="flex items-center gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedErrors.length }} selected
          </span>
          <UButton
            @click="deleteSelected"
            variant="soft"
            size="sm"
            icon="i-heroicons-trash"
          >
            Delete
          </UButton>
        </div>
      </div>
    </template>

    <div v-if="loading" class="p-12 text-center">
      <Icon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2"
      />
      <p class="text-gray-600 dark:text-gray-400">Loading issues...</p>
    </div>

    <div v-else-if="errors.length === 0" class="p-12 text-center">
      <Icon
        name="i-heroicons-inbox"
        class="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50"
      />
      <p class="text-gray-600 dark:text-gray-400">No issues found</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead
          class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        >
          <tr>
            <th class="px-6 py-3 text-left w-12">
              <UCheckbox
                :model-value="isAllSelected"
                @update:model-value="selectAll"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
          <tr
            v-for="error in errors"
            :key="error.id"
            :class="getRowBackgroundClass(error)"
            @click="emit('view', error)"
            @mouseenter="showPreview(error, $event)"
            @mouseleave="hidePreview"
          >
            <td class="px-6 py-4" @click.stop>
              <UCheckbox v-model="selectedErrors" :value="error.id" />
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <UBadge :color="getLevelBadgeColor(error.level)" size="sm">
                  {{ ERROR_LEVEL_CONFIG[error.level].label }}
                </UBadge>
                <UBadge
                  v-if="newErrorIds?.has(error.id)"
                  color="success"
                  variant="solid"
                  size="xs"
                  class="animate-bounce"
                >
                  NEW
                </UBadge>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="max-w-md">
                <p
                  class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1"
                >
                  {{ error.message || "No message" }}
                </p>
                <p
                  v-if="error.path"
                  class="text-xs text-gray-500 mt-1 line-clamp-1"
                >
                  {{ error.path }}
                </p>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <UBadge color="neutral" variant="soft" size="sm">
                {{ error.service }}
              </UBadge>
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400"
            >
              {{ getTimeAgo(error.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right" @click.stop>
              <div class="flex items-center justify-end gap-1">
                <!-- Quick Preview Button -->
                <UButton
                  @click.stop="emit('view', error)"
                  color="primary"
                  variant="ghost"
                  icon="i-heroicons-eye"
                  size="sm"
                  square
                  title="View Details"
                />

                <!-- Actions Dropdown -->
                <UDropdown
                  :items="[
                    [
                      {
                        label: 'View Details',
                        icon: 'i-heroicons-eye',
                        click: () => emit('view', error),
                      },
                      {
                        label: 'Copy ID',
                        icon: 'i-heroicons-clipboard',
                        click: () => navigator.clipboard.writeText(error.id),
                      },
                    ],
                    [
                      {
                        label: 'Delete',
                        icon: 'i-heroicons-trash',
                        click: () => emit('delete', error.id),
                      },
                    ],
                  ]"
                >
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-ellipsis-horizontal"
                    size="sm"
                    square
                  />
                </UDropdown>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Error Preview -->
    <ErrorPreview
      :error="previewError"
      :visible="previewVisible"
      :position="previewPosition"
      @close="closePreview"
      @view-full="viewFullDetails"
    />
  </UCard>
</template>

<style scoped>
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
