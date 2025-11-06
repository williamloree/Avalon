<template>
  <UCard class="animate-fade-in">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <Icon name="heroicons:funnel-20-solid" class="w-5 h-5" />
          Filters
        </h2>
        <UButton
          v-if="hasActiveFilters"
          @click="resetFilters"
          color="primary"
          variant="link"
          size="sm"
          :padded="false"
        >
          Reset Filters
        </UButton>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Search -->
      <UFormField label="Search">
        <UInput
          v-model="filters.search"
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Search message, service, or ID..."
          size="md"
        />
      </UFormField>

      <!-- Service filter -->
      <UFormField label="Service">
        <USelect
          v-model="filters.service"
          :options="serviceOptions"
          size="md"
          placeholder="All Services"
        />
      </UFormField>

      <!-- Level filter -->
      <UFormField label="Level">
        <USelect
          v-model="filters.level"
          :options="levelOptions"
          size="md"
          placeholder="All Levels"
        />
      </UFormField>

      <!-- Start date -->
      <UFormField label="Start Date">
        <UInput v-model="filters.startDate" type="date" size="md" />
      </UFormField>

      <!-- End date -->
      <UFormField label="End Date">
        <UInput v-model="filters.endDate" type="date" size="md" />
      </UFormField>
    </div>
  </UCard>
</template>
<script setup lang="ts">
import type { ErrorLevel } from "~/types";
import { ERROR_LEVEL_CONFIG } from "~/types";

const props = defineProps<{
  services: string[];
}>();

const { filters, resetFilters, hasActiveFilters } = useErrorFilters();

const errorLevels: ErrorLevel[] = [
  "critical",
  "fatal",
  "error",
  "warning",
  "info",
  "debug",
];

const serviceOptions = computed(() => [
  { label: "All Services", value: "" },
  ...props.services.map((s) => ({ label: s, value: s })),
]);

const levelOptions = computed(() => [
  { label: "All Levels", value: "" },
  ...errorLevels.map((level) => ({
    label: ERROR_LEVEL_CONFIG[level].label,
    value: level,
  })),
]);
</script>
