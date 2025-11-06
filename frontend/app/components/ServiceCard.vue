<script setup lang="ts">
const props = defineProps<{
  service: string;
  apiKeyName: string;
  isActive: boolean;
  lastUsedAt: string | null;
  errorCount: number;
  createdAt: string;
}>();

// Format date
const formatDate = (date: string | null) => {
  if (!date) return "Never";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Service status
const status = computed(() => {
  if (!props.isActive)
    return { label: "Inactive", color: "gray", icon: "i-heroicons-pause" };
  if (!props.lastUsedAt)
    return { label: "Not Used", color: "blue", icon: "i-heroicons-clock" };

  const lastUsed = new Date(props.lastUsedAt);
  const now = new Date();
  const hoursSinceLastUse =
    (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastUse < 1)
    return {
      label: "Active",
      color: "green",
      icon: "i-heroicons-check-circle",
    };
  if (hoursSinceLastUse < 24)
    return { label: "Recent", color: "yellow", icon: "i-heroicons-clock" };
  return {
    label: "Idle",
    color: "orange",
    icon: "i-heroicons-exclamation-triangle",
  };
});
</script>

<template>
  <UCard class="hover:shadow-lg transition-shadow duration-200">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg"
          >
            {{ service.substring(0, 2).toUpperCase() }}
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ service }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ apiKeyName }}
            </p>
          </div>
        </div>
        <UBadge :color="status.color" variant="soft" size="sm">
          <Icon :name="status.icon" class="w-3 h-3 mr-1" />
          {{ status.label }}
        </UBadge>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Errors</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ errorCount }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Last Active
          </p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ formatDate(lastUsedAt) }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-gray-200 dark:border-gray-800">
        <div
          class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
        >
          <span>Created {{ formatDate(createdAt) }}</span>
          <NuxtLink
            to="/services"
            class="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Manage
            <Icon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </UCard>
</template>
