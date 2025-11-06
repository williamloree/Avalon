<script setup lang="ts">
useHead({
  title: "Settings - Avalon Error Manager",
  meta: [
    {
      name: "description",
      content: "Manage your application settings and preferences",
    },
  ],
});

const colorMode = useColorMode();
const { user } = useAuth();

// State
const isSaving = ref(false);
const settings = ref({
  notifications: {
    errors: true,
    critical: true,
    email: false,
    emailAddress: user.value?.email || "",
  },
  retentionDays: 30,
  autoDelete: false,
  theme: colorMode.preference,
});

// Theme options
const themeOptions = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

// Watch theme changes
watch(() => settings.value.theme, (newTheme) => {
  colorMode.preference = newTheme;
});

// Methods
const saveSettings = async () => {
  isSaving.value = true;
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Save to localStorage
    localStorage.setItem("avalon-settings", JSON.stringify(settings.value));

    // Show success message
    const toast = useToast();
    toast.add({
      title: "Success",
      description: "Settings saved successfully",
      color: "green",
      icon: "i-heroicons-check-circle",
    });
  } catch (e: any) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to save settings",
      color: "red",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    isSaving.value = false;
  }
};

const resetSettings = () => {
  settings.value = {
    notifications: {
      errors: true,
      critical: true,
      email: false,
      emailAddress: user.value?.email || "",
    },
    retentionDays: 30,
    autoDelete: false,
    theme: "system",
  };
  colorMode.preference = "system";

  const toast = useToast();
  toast.add({
    title: "Settings Reset",
    description: "All settings have been reset to defaults",
    color: "blue",
    icon: "i-heroicons-arrow-path",
  });
};

// Load settings on mount
onMounted(() => {
  const saved = localStorage.getItem("avalon-settings");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      settings.value = { ...settings.value, ...parsed };
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }
});
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="mx-auto space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your preferences and notifications
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UButton @click="resetSettings" variant="ghost" color="neutral" icon="i-heroicons-arrow-path">
            Reset
          </UButton>
          <UButton
            @click="saveSettings"
            icon="i-heroicons-check"
            :loading="isSaving"
            color="primary"
          >
            Save Changes
          </UButton>
        </div>
      </div>

      <!-- Settings Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Appearance Settings -->
        <UCard class="group hover:shadow-xl transition-all duration-300">
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
              >
                <Icon name="i-heroicons-paint-brush" class="w-6 h-6" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Appearance
                </h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Customize your interface
                </p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <UFormField label="Theme Preference" description="Choose your preferred color theme">
              <USelect
                v-model="settings.theme"
                :items="themeOptions"
                size="lg"
                icon="i-heroicons-moon"
              />
            </UFormField>

            <div class="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div class="flex items-center gap-3">
                  <Icon name="i-heroicons-user-circle" class="w-8 h-8 text-gray-400" />
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ user?.username || 'User' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ user?.email || 'No email set' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Notifications Settings -->
        <UCard class="group hover:shadow-xl transition-all duration-300">
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
              >
                <Icon name="i-heroicons-bell" class="w-6 h-6" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Control your alerts
                </p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Critical Alerts
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    High-priority error notifications
                  </p>
                </div>
              </div>
              <UToggle v-model="settings.notifications.critical" size="lg" />
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Icon name="i-heroicons-bell-alert" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Error Notifications
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Receive all error alerts
                  </p>
                </div>
              </div>
              <UToggle v-model="settings.notifications.errors" size="lg" />
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Icon name="i-heroicons-envelope" class="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Email Notifications
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Send alerts to your email
                  </p>
                </div>
              </div>
              <UToggle v-model="settings.notifications.email" size="lg" />
            </div>

            <UFormField v-if="settings.notifications.email" label="Email Address" description="Where to send notifications">
              <UInput
                v-model="settings.notifications.emailAddress"
                type="email"
                size="lg"
                icon="i-heroicons-envelope"
                placeholder="admin@example.com"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Data Management -->
        <UCard class="group hover:shadow-xl transition-all duration-300">
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
              >
                <Icon name="i-heroicons-archive-box" class="w-6 h-6" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Data Management
                </h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Control error data retention
                </p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <UFormField label="Retention Period" description="How long to keep error data (days)">
              <UInput
                v-model.number="settings.retentionDays"
                type="number"
                size="lg"
                min="1"
                max="365"
                icon="i-heroicons-calendar"
              />
            </UFormField>

            <div class="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Icon name="i-heroicons-trash" class="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Auto-Delete Old Errors
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Remove errors after retention period
                  </p>
                </div>
              </div>
              <UToggle v-model="settings.autoDelete" size="lg" />
            </div>

            <UAlert
              icon="i-heroicons-information-circle"
              color="primary"
              variant="soft"
              title="Storage Information"
              description="Older errors will be automatically archived based on your retention settings"
            />
          </div>
        </UCard>

        <!-- Quick Links -->
        <UCard class="group hover:shadow-xl transition-all duration-300">
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
              >
                <Icon name="i-heroicons-link" class="w-6 h-6" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Access
                </h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Manage your services and docs
                </p>
              </div>
            </div>
          </template>

          <div class="space-y-3">
            <UButton
              to="/services"
              icon="i-heroicons-server-stack"
              variant="soft"
              color="blue"
              size="lg"
              block
              class="justify-start"
            >
              Manage Services
            </UButton>

            <UButton
              to="/docs"
              icon="i-heroicons-book-open"
              variant="soft"
              color="purple"
              size="lg"
              block
              class="justify-start"
            >
              Documentation
            </UButton>

            <UButton
              to="/support"
              icon="i-heroicons-question-mark-circle"
              variant="soft"
              color="green"
              size="lg"
              block
              class="justify-start"
            >
              Help & Support
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
