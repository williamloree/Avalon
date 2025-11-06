<script setup lang="ts">
const props = defineProps<{
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
    icon?: string;
    label?: string;
  };
  subtitle?: string;
  description?: string;
  color?: "blue" | "green" | "red" | "purple" | "orange" | "pink";
}>();

const colorClasses = {
  blue: "from-blue-500 to-blue-600 shadow-blue-500/30",
  green: "from-green-500 to-green-600 shadow-green-500/30",
  red: "from-red-500 to-red-600 shadow-red-500/30",
  purple: "from-purple-500 to-purple-600 shadow-purple-500/30",
  orange: "from-orange-500 to-orange-600 shadow-orange-500/30",
  pink: "from-pink-500 to-pink-600 shadow-pink-500/30",
};

const iconColor = computed(() => colorClasses[props.color || "blue"]);
</script>

<template>
  <UCard class="group transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          {{ title }}
        </p>
        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          {{ value }}
        </p>

        <!-- Description -->
        <p
          v-if="description"
          class="text-xs text-gray-500 dark:text-gray-500 mt-2"
        >
          {{ description }}
        </p>

        <!-- Trend -->
        <div v-else-if="trend" class="flex items-center gap-1 mt-2">
          <Icon
            :name="
              trend.icon ||
              (trend.isPositive
                ? 'i-heroicons-arrow-trending-up'
                : 'i-heroicons-arrow-trending-down')
            "
            class="w-4 h-4"
            :class="trend.isPositive ? 'text-green-600' : 'text-red-600'"
          />
          <span
            class="text-sm font-medium"
            :class="trend.isPositive ? 'text-green-600' : 'text-red-600'"
          >
            {{ trend.value }}%
          </span>
          <span class="text-sm font-medium"> {{ trend.label }}</span>
        </div>
      </div>

      <div
        class="w-14 h-14 rounded-2xl bg-linear-to-br flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
        :class="iconColor"
      >
        <Icon :name="icon" class="w-7 h-7" />
      </div>
    </div>
  </UCard>
</template>
