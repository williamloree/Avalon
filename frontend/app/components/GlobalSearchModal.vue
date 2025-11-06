<script setup lang="ts">
const {
  searchQuery,
  isSearchOpen,
  searchResults,
  isSearching,
  search,
  closeSearch
} = useGlobalSearch();

const router = useRouter();

// Watch for search query changes
watch(searchQuery, (newQuery) => {
  console.log('[GlobalSearchModal] searchQuery changed:', newQuery);
  console.log('[GlobalSearchModal] searchResults before search:', searchResults.value);
  if (newQuery && newQuery.trim().length > 0) {
    search(newQuery);
  } else {
    // Show all pages when query is empty
    search('');
  }
  console.log('[GlobalSearchModal] searchResults after search call:', searchResults.value);
});

// Navigate to result
const navigateToResult = (result: any) => {
  router.push(result.url);
  closeSearch();
};

// Get icon color based on type
const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    error: 'text-red-600 dark:text-red-400',
    service: 'text-blue-600 dark:text-blue-400',
    release: 'text-purple-600 dark:text-purple-400',
    page: 'text-gray-600 dark:text-gray-400',
    doc: 'text-green-600 dark:text-green-400',
  };
  return colors[type] || colors.page;
};

// Get type label
const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    error: 'Error',
    service: 'Service',
    release: 'Release',
    page: 'Page',
    doc: 'Documentation',
  };
  return labels[type] || 'Result';
};

// Keyboard navigation
const selectedIndex = ref(0);

watch(searchResults, () => {
  selectedIndex.value = 0;
});

const handleKeydown = (event: KeyboardEvent) => {
  if (!isSearchOpen.value) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      break;
    case 'Enter':
      event.preventDefault();
      if (searchResults.value[selectedIndex.value]) {
        navigateToResult(searchResults.value[selectedIndex.value]);
      }
      break;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <UModal
    v-model:open="isSearchOpen"
    :dismissible="true"
    @close="closeSearch"
  >
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <Icon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search issues, pages, documentation..."
              class="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 text-lg"
              autofocus
            />
            <div class="flex items-center gap-1">
              <UKbd size="lg">ESC</UKbd>
            </div>
          </div>
        </template>

          <!-- Loading State -->
          <div v-if="isSearching" class="py-12 text-center">
            <Icon
              name="i-heroicons-arrow-path"
              class="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2"
            />
            <p class="text-sm text-gray-600 dark:text-gray-400">Searching...</p>
          </div>

          <!-- No Results -->
          <div
            v-else-if="searchResults.length === 0"
            class="py-12 text-center"
          >
            <Icon
              name="i-heroicons-inbox"
              class="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50"
            />
            <p class="text-gray-600 dark:text-gray-400 mb-2">No results found</p>
            <p class="text-sm text-gray-500 dark:text-gray-500">
              Try searching with different keywords
            </p>
          </div>

          <!-- Results (both quick nav and search results) -->
          <div v-else class="space-y-2">
            <div class="px-3 py-2">
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {{ (!searchQuery || searchQuery.trim().length === 0) ? 'Quick Navigation' : 'Search Results' }}
                ({{ searchResults.length }} results)
              </p>
            </div>
            <button
              v-for="(result, index) in searchResults"
              :key="result.id"
              @click="navigateToResult(result)"
              class="w-full text-left p-3 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              :class="{
                'bg-gray-100 dark:bg-gray-800': selectedIndex === index,
              }"
            >
              <div class="flex items-start gap-3">
                <div
                  class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="
                    result.type === 'error'
                      ? 'bg-red-100 dark:bg-red-900/20'
                      : result.type === 'service'
                      ? 'bg-blue-100 dark:bg-blue-900/20'
                      : result.type === 'release'
                      ? 'bg-purple-100 dark:bg-purple-900/20'
                      : result.type === 'doc'
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-gray-100 dark:bg-gray-800'
                  "
                >
                  <Icon :name="result.icon" class="w-5 h-5" :class="getTypeColor(result.type)" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {{ result.title }}
                    </h4>
                    <UBadge v-if="searchQuery && searchQuery.trim().length > 0" size="xs" color="neutral" variant="soft">
                      {{ getTypeLabel(result.type) }}
                    </UBadge>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {{ result.description }}
                  </p>
                </div>

                <Icon
                  name="i-heroicons-arrow-right"
                  class="shrink-0 w-4 h-4 text-gray-400"
                />
              </div>
            </button>
          </div>

        <template #footer>
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1">
                <UKbd size="lg">↑</UKbd>
                <UKbd size="lg">↓</UKbd>
                <span>Navigate</span>
              </div>
              <div class="flex items-center gap-1">
                <UKbd size="lg">Enter</UKbd>
                <span>Select</span>
              </div>
              <div class="flex items-center gap-1">
                <UKbd size="lg">ESC</UKbd>
                <span>Close</span>
              </div>
            </div>
            <span>{{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}</span>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
