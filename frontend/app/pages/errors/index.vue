<template>
  <div class="p-6 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Issues</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ filteredErrors.length }} issue{{
            filteredErrors.length !== 1 ? "s" : ""
          }}
          found
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Real-time Connection Status -->
        <div
          class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
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

        <UButton
          @click="confirmDeleteAll"
          :disabled="isLoading || filteredErrors.length === 0"
          color="error"
          variant="soft"
          icon="i-heroicons-trash"
        >
          Delete All
        </UButton>

        <UButton
          @click="loadErrors"
          :disabled="isLoading"
          :loading="isLoading"
          icon="i-heroicons-arrow-path"
        >
          Refresh
        </UButton>
      </div>
    </div>

    <!-- Errors Table -->
    <UCard>
      <div v-if="isLoading" class="p-12 text-center">
        <Icon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2"
        />
        <p class="text-gray-600 dark:text-gray-400">Loading issues...</p>
      </div>

      <div v-else-if="paginatedErrors.length === 0" class="p-12 text-center">
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
              <th
                v-for="column in columns"
                :key="column.key"
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                @click="column.sortable ? toggleSort(column.key) : null"
              >
                <div class="flex items-center gap-2">
                  {{ column.label }}
                  <Icon
                    v-if="column.sortable && sortBy === column.key"
                    :name="
                      sortOrder === 'asc'
                        ? 'i-heroicons-chevron-up'
                        : 'i-heroicons-chevron-down'
                    "
                    class="w-4 h-4"
                  />
                </div>
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="error in paginatedErrors"
              :key="error.id"
              :class="getRowClass(error.level)"
              @click="viewError(error)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <Icon
                    :name="ERROR_LEVEL_CONFIG[error.level].icon"
                    class="w-4 h-4 shrink-0"
                    :class="ERROR_LEVEL_CONFIG[error.level].textColor"
                  />
                  <UBadge
                    :color="getLevelBadgeColor(error.level) as any"
                    size="sm"
                  >
                    {{ ERROR_LEVEL_CONFIG[error.level].label }}
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
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    @click.stop="viewError(error)"
                    color="primary"
                    variant="ghost"
                    icon="i-heroicons-eye"
                    size="sm"
                    square
                    title="View Details"
                  />
                  <UButton
                    @click.stop="confirmDeleteError(error)"
                    color="error"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    size="sm"
                    square
                    title="Delete"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Pagination -->
    <UCard v-if="totalPages > 1">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Showing <span class="font-medium">{{ pagination.skip + 1 }}</span> to
          <span class="font-medium">{{
            Math.min(pagination.skip + pagination.take, filteredErrors.length)
          }}</span>
          of
          <span class="font-medium">{{ filteredErrors.length }}</span> results
        </div>
        <div class="flex items-center gap-2">
          <UButton
            @click="prevPage"
            :disabled="currentPage === 1"
            icon="i-heroicons-chevron-left"
            color="neutral"
            size="sm"
            square
          />
          <div class="flex items-center gap-1">
            <UButton
              v-for="page in Math.min(totalPages, 5)"
              :key="page"
              @click="goToPage(page)"
              :color="currentPage === page ? 'primary' : 'neutral'"
              :variant="currentPage === page ? 'solid' : 'ghost'"
              size="sm"
              square
            >
              {{ page }}
            </UButton>
            <span v-if="totalPages > 5" class="px-2 text-gray-400">...</span>
          </div>
          <UButton
            @click="nextPage"
            :disabled="currentPage === totalPages"
            icon="i-heroicons-chevron-right"
            color="neutral"
            size="sm"
            square
          />
        </div>
      </div>
    </UCard>

    <!-- Error Modal -->
    <ErrorModal
      :error="selectedError"
      :is-open="isModalOpen"
      @close="isModalOpen = false"
    />

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="showDeleteModal"
      :title="deleteMode === 'all' ? 'Delete All Errors' : 'Delete Error'"
      description="This action cannot be undone"
      :dismissible="!isDeleting"
    >
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="shrink-0 w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center"
              >
                <Icon
                  name="i-heroicons-exclamation-triangle"
                  class="w-6 h-6 text-red-600 dark:text-red-400"
                />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{
                    deleteMode === "all" ? "Delete All Errors" : "Delete Error"
                  }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
            </div>
          </template>

          <template #body>
            <div class="space-y-4">
              <div
                v-if="deleteMode === 'all'"
                class="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
              >
                <p class="text-sm text-red-900 dark:text-red-200 font-medium">
                  ⚠️ Warning: You are about to delete
                  <strong>{{ filteredErrors.length }} error(s)</strong>
                </p>
              </div>

              <p class="text-gray-700 dark:text-gray-300">
                <span v-if="deleteMode === 'all'">
                  This will permanently remove all errors from the database. All
                  error data, including stack traces and metadata, will be lost
                  forever.
                </span>
                <span v-else>
                  Are you sure you want to delete this error? This will
                  permanently remove it from the database along with all
                  associated data.
                </span>
              </p>

              <div class="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  💡 Tip: Consider archiving errors instead of deleting them if
                  you might need them for future reference.
                </p>
              </div>
            </div>
          </template>

          <template #footer>
            <div class="flex items-center justify-end gap-3">
              <UButton
                @click="showDeleteModal = false"
                color="neutral"
                variant="soft"
                :disabled="isDeleting"
              >
                Cancel
              </UButton>
              <UButton
                @click="handleDelete"
                color="error"
                :loading="isDeleting"
                :disabled="isDeleting"
                icon="i-heroicons-trash"
              >
                {{
                  deleteMode === "all"
                    ? `Delete All (${filteredErrors.length})`
                    : "Delete Error"
                }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ErrorEvent, PaginationOptions } from "~/types";
import { ERROR_LEVEL_CONFIG } from "~/types";
import { formatDistanceToNow } from "date-fns";

// SEO
useHead({
  title: "Issues - Avalon Error Manager",
  meta: [
    {
      name: "description",
      content: "Browse and manage all application errors",
    },
  ],
});

const { fetchErrors, deleteError, deleteAllErrors } = useErrorApi();
const { success, error: showError } = useCustomToast();
const { onError, isConnected, connect: connectWebSocket } = useWebSocket();

// Search from header
const route = useRoute();
const searchQuery = computed(() => (route.query.search as string) || "");

// State
const allErrors = ref<ErrorEvent[]>([]);
const filteredErrors = ref<ErrorEvent[]>([]);
const selectedError = ref<ErrorEvent | null>(null);
const isModalOpen = ref(false);
const isLoading = ref(false);
const pagination = ref<PaginationOptions>({ take: 50, skip: 0 });

// Delete state
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const deleteMode = ref<"single" | "all">("single");
const errorToDelete = ref<ErrorEvent | null>(null);

// Sorting
const sortBy = ref<string>("createdAt");
const sortOrder = ref<"asc" | "desc">("desc");

// Columns
const columns = [
  { key: "level", label: "Level", sortable: true },
  { key: "message", label: "Issue", sortable: true },
  { key: "service", label: "Service", sortable: true },
  { key: "createdAt", label: "Time", sortable: true },
];

// Computed
const paginatedErrors = computed(() => {
  const start = pagination.value.skip;
  const end = start + pagination.value.take;
  return filteredErrors.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredErrors.value.length / pagination.value.take);
});

const currentPage = computed(() => {
  return Math.floor(pagination.value.skip / pagination.value.take) + 1;
});

// Methods
const loadErrors = async () => {
  isLoading.value = true;
  try {
    const data = await fetchErrors({ take: 200, skip: 0 });
    allErrors.value = data;
    applyFilters();
  } catch (e: any) {
    showError("Failed to load errors: " + e.message);
  } finally {
    isLoading.value = false;
  }
};

const applyFilters = () => {
  let filtered = [...allErrors.value];

  // Apply search filter
  if (searchQuery.value && searchQuery.value.trim() !== "") {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((error) => {
      const matchMessage = error.message?.toLowerCase().includes(query);
      const matchService = error.service.toLowerCase().includes(query);
      const matchId = error.id.toLowerCase().includes(query);
      return matchMessage || matchService || matchId;
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aVal: any = a[sortBy.value as keyof ErrorEvent];
    let bVal: any = b[sortBy.value as keyof ErrorEvent];

    // Handle dates
    if (sortBy.value === "createdAt") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    // Handle strings
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder.value === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder.value === "asc" ? 1 : -1;
    return 0;
  });

  filteredErrors.value = filtered;
  pagination.value.skip = 0;
};

const toggleSort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = column;
    sortOrder.value = "asc";
  }
  applyFilters();
};

const viewError = (error: ErrorEvent) => {
  selectedError.value = error;
  isModalOpen.value = true;
};

const confirmDeleteError = (error: ErrorEvent) => {
  errorToDelete.value = error;
  deleteMode.value = "single";
  showDeleteModal.value = true;
};

const confirmDeleteAll = () => {
  deleteMode.value = "all";
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  isDeleting.value = true;
  try {
    if (deleteMode.value === "all") {
      await deleteAllErrors();
      allErrors.value = [];
      applyFilters();
      success("All errors deleted successfully");
    } else if (errorToDelete.value) {
      await deleteError(errorToDelete.value.id);
      allErrors.value = allErrors.value.filter(
        (e) => e.id !== errorToDelete.value!.id
      );
      applyFilters();
      success("Error deleted successfully");
    }
    showDeleteModal.value = false;
    errorToDelete.value = null;
  } catch (e: any) {
    showError("Failed to delete: " + e.message);
  } finally {
    isDeleting.value = false;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    pagination.value.skip += pagination.value.take;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    pagination.value.skip -= pagination.value.take;
  }
};

const goToPage = (page: number) => {
  pagination.value.skip = (page - 1) * pagination.value.take;
};

const getTimeAgo = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const getLevelBadgeColor = (level: string) => {
  const config = ERROR_LEVEL_CONFIG[level as keyof typeof ERROR_LEVEL_CONFIG];
  return config?.color || "gray";
};

const getRowClass = (level: string) => {
  const baseClass = "transition-all duration-200 cursor-pointer border-l-4";

  switch (level) {
    case "critical":
      return `${baseClass} border-l-red-600 hover:bg-red-50 dark:hover:bg-red-950/20`;
    case "fatal":
      return `${baseClass} border-l-red-900 hover:bg-red-50 dark:hover:bg-red-950/20`;
    case "error":
      return `${baseClass} border-l-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`;
    case "warning":
      return `${baseClass} border-l-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20`;
    case "info":
      return `${baseClass} border-l-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20`;
    case "debug":
      return `${baseClass} border-l-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50`;
    default:
      return `${baseClass} border-l-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50`;
  }
};

// Handle new errors from WebSocket
const handleNewError = (error: ErrorEvent) => {
  allErrors.value = [error, ...allErrors.value];
  applyFilters();
  success(
    `New ${ERROR_LEVEL_CONFIG[error.level].label} error from ${error.service}`
  );
};

// Watch search query from header
watch(searchQuery, () => {
  applyFilters();
});

// Watch sorting
watch([sortBy, sortOrder], () => {
  applyFilters();
});

// Load on mount
onMounted(() => {
  connectWebSocket();
  loadErrors();

  const unsubscribe = onError(handleNewError);
  onUnmounted(() => {
    unsubscribe();
  });
});
</script>
