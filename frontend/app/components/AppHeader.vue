<script setup lang="ts">
const colorMode = useColorMode();
const { logout, user } = useAuth();
const { searchQuery, openSearch } = useGlobalSearch();

const isDark = computed({
  get() {
    return colorMode.value === "dark";
  },
  set(value) {
    colorMode.preference = value ? "dark" : "light";
  },
});

const quickActions = [
  {
    label: "View Docs",
    icon: "i-heroicons-book-open",
    to: "/docs",
    color: "gray",
  },
];

const handleLogout = () => {
  logout();
};

// Open search modal when clicking on input
const handleSearchClick = () => {
  openSearch();
};

// Keyboard shortcut for search (Cmd+K or Ctrl+K)
const handleKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    openSearch();
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
  <header
    class="fixed top-0 right-0 left-64 z-30 h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl"
  >
    <div class="flex items-center justify-between h-full px-6">
      <!-- Search Bar -->
      <div class="flex-1 max-w-2xl">
        <button
          @click="handleSearchClick"
          class="w-full"
        >
          <UInput
            :model-value="searchQuery"
            icon="i-heroicons-magnifying-glass"
            size="lg"
            placeholder="Search issues, events, or documentation..."
            class="w-full cursor-pointer"
            readonly
          >
            <template #trailing>
              <div class="flex items-center gap-1">
                <UKbd size="sm">⌘</UKbd>
                <UKbd size="sm">K</UKbd>
              </div>
            </template>
          </UInput>
        </button>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <!-- Quick Actions -->
        <div class="flex items-center gap-2">
          <UButton
            v-for="action in quickActions"
            :key="action.to"
            :icon="action.icon"
            variant="ghost"
            size="lg"
            square
            :to="action.to"
            :title="action.label"
          />
        </div>

        <!-- Divider -->
        <div class="h-6 w-px bg-gray-200 dark:bg-gray-800"></div>

        <!-- Settings Dropdown -->
        <UDropdownMenu
          :items="[
            [
              {
                label: 'General',
                icon: 'i-heroicons-cog-6-tooth',
                to: '/settings',
              },
              {
                label: 'Services',
                icon: 'i-heroicons-server-stack',
                to: '/services',
              },
            ],
          ]"
          :popper="{ placement: 'bottom-end' }"
        >
          <UButton
            icon="i-heroicons-cog-6-tooth"
            variant="ghost"
            size="lg"
            square
            title="Settings"
          />
        </UDropdownMenu>

        <!-- Theme Toggle -->
        <UButton
          :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
          color="neutral"
          variant="ghost"
          size="lg"
          square
          :title="isDark ? 'Light Mode' : 'Dark Mode'"
          @click="isDark = !isDark"
        />

        <!-- Divider -->
        <div class="h-6 w-px bg-gray-200 dark:bg-gray-800"></div>

        <!-- User Menu -->
        <UDropdownMenu
          :items="[
            [
              { label: 'Profile', icon: 'i-heroicons-user', to: '/profile' },
            ],
            [
              {
                label: 'Documentation',
                icon: 'i-heroicons-book-open',
                to: '/docs',
              },
              {
                label: 'Help & Support',
                icon: 'i-heroicons-question-mark-circle',
                to: '/support',
              },
            ],
            [
              {
                label: 'Sign out',
                icon: 'i-heroicons-arrow-right-on-rectangle',
                onSelect() {
                  handleLogout();
                },
              },
            ],
          ]"
          :popper="{ placement: 'bottom-end' }"
        >
          <UButton color="neutral" variant="ghost" class="gap-2">
            <div
              class="w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-xs"
            >
              {{ user?.username?.substring(0, 2).toUpperCase() || "AD" }}
            </div>
            <span class="text-sm font-medium hidden sm:inline">{{
              user?.username || "Admin"
            }}</span>
            <Icon name="i-heroicons-chevron-down" class="w-4 h-4" />
          </UButton>
        </UDropdownMenu>
      </div>
    </div>
  </header>
</template>
