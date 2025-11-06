<script setup lang="ts">
const route = useRoute();
const { user, logout } = useAuth();

const handleLogout = () => {
  logout();
};

const userMenuItems = [
  [
    { label: "Profile", icon: "i-heroicons-user", to: "/profile" },
    {
      label: "Support",
      icon: "i-heroicons-question-mark-circle",
      to: "/support",
    },
  ],
  [
    {
      label: "Sign Out",
      icon: "i-heroicons-arrow-right-on-rectangle",
      onSelect() {
        handleLogout();
      },
    },
  ],
];

const navigation = [
  {
    label: "Dashboard",
    icon: "i-heroicons-home",
    to: "/",
    badge: null,
  },
  {
    label: "Issues",
    icon: "i-heroicons-exclamation-triangle",
    to: "/errors",
    badge: null,
  },
  {
    label: "Services",
    icon: "i-heroicons-server-stack",
    to: "/services",
    badge: null,
  },
  // {
  //   label: "Performance",
  //   icon: "i-heroicons-chart-bar",
  //   to: "/performance",
  //   badge: null,
  // },
  // {
  //   label: "Releases",
  //   icon: "i-heroicons-rocket-launch",
  //   to: "/releases",
  //   badge: null,
  // },
];

const isActive = (path: string) => {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
};
</script>

<template>
  <aside
    class="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-slide-in-left flex flex-col"
  >
    <!-- Logo -->
    <div
      class="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-800"
    >
      <div
        class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600"
      >
        <Icon name="i-heroicons-shield-check" class="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 class="font-bold text-lg text-gray-900 dark:text-white">Avalon</h1>
        <p class="text-xs text-gray-500">Error Manager</p>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
      <div class="space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          :class="[
            isActive(item.to)
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
          ]"
        >
          <Icon :name="item.icon" class="w-5 h-5 shrink-0" />
          <span class="flex-1">{{ item.label }}</span>
          <UBadge v-if="item.badge" size="xs" color="neutral" variant="soft">
            {{ item.badge }}
          </UBadge>
        </NuxtLink>
      </div>
    </nav>

    <!-- User section -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <UDropdownMenu
        :items="userMenuItems"
        :popper="{ placement: 'top-start' }"
      >
        <div
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
        >
          <div
            class="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-sm"
          >
            {{ user?.username.slice(0, 2).toUpperCase() || "AD" }}
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium text-gray-900 dark:text-white truncate"
            >
              {{ user?.username || "Admin" }}
            </p>
            <p class="text-xs text-gray-500 truncate">admin@avalon.dev</p>
          </div>
          <Icon
            name="i-heroicons-chevron-up-down"
            class="w-5 h-5 text-gray-400"
          />
        </div>
      </UDropdownMenu>
    </div>
  </aside>
</template>
