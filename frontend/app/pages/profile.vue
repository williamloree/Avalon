<script setup lang="ts">
useHead({
  title: "Profile - Avalon Error Manager",
  meta: [
    {
      name: "description",
      content: "Manage your profile and account settings",
    },
  ],
});

const { user, updateProfile } = useAuth();

// State
const isSaving = ref(false);
const isChangingPassword = ref(false);
const showChangePassword = ref(false);

const profileForm = ref({
  username: user.value?.username || "",
  email: user.value?.email || "",
});

const passwordForm = ref({
  current: "",
  new: "",
  confirm: "",
});

// Computed
const initials = computed(() => {
  const name = user.value?.username || "AD";
  return name.substring(0, 2).toUpperCase();
});

const hasChanges = computed(() => {
  return (
    profileForm.value.username !== user.value?.username ||
    profileForm.value.email !== user.value?.email
  );
});

// Methods
const saveProfile = async () => {
  if (!hasChanges.value) {
    const toast = useToast();
    toast.add({
      title: "No Changes",
      description: "No changes to save",
      color: "blue",
      icon: "i-heroicons-information-circle",
    });
    return;
  }

  isSaving.value = true;
  try {
    const result = await updateProfile({
      username: profileForm.value.username,
      email: profileForm.value.email,
    });

    if (result.success) {
      const toast = useToast();
      toast.add({
        title: "Success",
        description: "Profile updated successfully",
        color: "green",
        icon: "i-heroicons-check-circle",
      });
    } else {
      const toast = useToast();
      toast.add({
        title: "Error",
        description: result.error || "Failed to update profile",
        color: "red",
        icon: "i-heroicons-x-circle",
      });
      resetProfile();
    }
  } catch (e: any) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to update profile",
      color: "red",
      icon: "i-heroicons-x-circle",
    });
    resetProfile();
  } finally {
    isSaving.value = false;
  }
};

const changePassword = async () => {
  if (
    !passwordForm.value.current ||
    !passwordForm.value.new ||
    !passwordForm.value.confirm
  ) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Please fill in all password fields",
      color: "red",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  if (passwordForm.value.new !== passwordForm.value.confirm) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "New passwords do not match",
      color: "red",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  if (passwordForm.value.new.length < 8) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Password must be at least 8 characters long",
      color: "red",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  isChangingPassword.value = true;
  try {
    const result = await updateProfile({
      currentPassword: passwordForm.value.current,
      newPassword: passwordForm.value.new,
    });

    if (result.success) {
      const toast = useToast();
      toast.add({
        title: "Success",
        description: "Password changed successfully",
        color: "green",
        icon: "i-heroicons-check-circle",
      });
      showChangePassword.value = false;
      passwordForm.value = {
        current: "",
        new: "",
        confirm: "",
      };
    } else {
      const toast = useToast();
      toast.add({
        title: "Error",
        description: result.error || "Failed to change password",
        color: "red",
        icon: "i-heroicons-x-circle",
      });
    }
  } catch (e: any) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to change password",
      color: "red",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    isChangingPassword.value = false;
  }
};

const resetProfile = () => {
  profileForm.value = {
    username: user.value?.username || "",
    email: user.value?.email || "",
  };
};

// Watch user changes
watch(
  user,
  (newUser) => {
    if (newUser) {
      profileForm.value = {
        username: newUser.username,
        email: newUser.email || "",
      };
    }
  },
  { immediate: true }
);

// Account stats
const accountStats = computed(() => {
  const createdDate = new Date(2024, 0, 15); // Mock date
  const daysSinceCreation = Math.floor(
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return [
    {
      label: "Member Since",
      value: createdDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      icon: "i-heroicons-calendar",
      color: "blue",
    },
    {
      label: "Active Days",
      value: daysSinceCreation,
      icon: "i-heroicons-fire",
      color: "orange",
    },
    {
      label: "Services",
      value: "3",
      icon: "i-heroicons-server-stack",
      color: "purple",
    },
  ];
});
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="mx-auto space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your account information
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Profile Card -->
        <div class="space-y-6">
          <UCard class="group hover:shadow-xl transition-all duration-300">
            <div class="flex flex-col items-center text-center space-y-4">
              <!-- Avatar -->
              <div class="relative">
                <div
                  class="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-pink-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                >
                  {{ initials }}
                </div>
              </div>

              <!-- User Info -->
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ user?.username }}
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ user?.email || "No email set" }}
                </p>
                <UBadge color="primary" variant="soft" size="sm" class="mt-3">
                  Administrator
                </UBadge>
              </div>
            </div>
          </UCard>

          <!-- Quick Actions -->
          <UCard class="group hover:shadow-xl transition-all duration-300">
            <template #header>
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30"
                >
                  <Icon name="i-heroicons-bolt" class="w-5 h-5" />
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  Quick Actions
                </h3>
              </div>
            </template>

            <div class="space-y-2">
              <UButton
                block
                variant="soft"
                color="warning"
                icon="i-heroicons-key"
                size="lg"
                class="justify-start cursor-pointer"
                @click="showChangePassword = true"
              >
                Change Password
              </UButton>
              <UButton
                to="/settings"
                block
                variant="soft"
                color="primary"
                icon="i-heroicons-cog-6-tooth"
                size="lg"
                class="justify-start"
              >
                Settings
              </UButton>
              <UButton
                to="/services"
                block
                variant="soft"
                color="secondary"
                icon="i-heroicons-server-stack"
                size="lg"
                class="justify-start"
              >
                Services
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- Profile Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Account Information -->
          <UCard class="group hover:shadow-xl transition-all duration-300">
            <template #header>
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                >
                  <Icon name="i-heroicons-user" class="w-6 h-6" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Account Information
                  </h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Update your personal details
                  </p>
                </div>
              </div>
            </template>

            <div class="flex space-x-8">
              <UFormField label="Username" description="Your display name across the platform">
                <UInput
                  v-model="profileForm.username"
                  size="lg"
                  icon="i-heroicons-user"
                  placeholder="Enter your username"
                />
              </UFormField>

              <UFormField label="Email Address" description="Your email for notifications and recovery">
                <UInput
                  v-model="profileForm.email"
                  type="email"
                  size="lg"
                  icon="i-heroicons-envelope"
                  placeholder="Enter your email"
                />
              </UFormField>
            </div>
          </UCard>

          <!-- Security -->
          <UCard class="group hover:shadow-xl transition-all duration-300">
            <template #header>
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                >
                  <Icon name="i-heroicons-lock-closed" class="w-6 h-6" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Security
                  </h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Manage your password and security settings
                  </p>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div class="flex items-center gap-3">
                  <Icon
                    name="i-heroicons-key"
                    class="w-5 h-5 text-purple-600 dark:text-purple-400"
                  />
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      Password
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Last changed 30 days ago
                    </p>
                  </div>
                </div>
                <UButton
                  variant="soft"
                  color="warning"
                  size="sm"
                  class="cursor-pointer"
                  @click="showChangePassword = true"
                >
                  Change
                </UButton>
              </div>

              <UAlert
                icon="i-heroicons-shield-check"
                color="primary"
                variant="soft"
                title="Security Tip"
                description="Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols."
              />
            </div>
          </UCard>

          <!-- Save Button -->
          <div class="flex items-center justify-end gap-3">
            <UButton
              @click="resetProfile"
              variant="ghost"
              color="neutral"
              icon="i-heroicons-arrow-path"
              :disabled="!hasChanges"
            >
              Reset
            </UButton>
            <UButton
              @click="saveProfile"
              icon="i-heroicons-check"
              :loading="isSaving"
              color="primary"
              size="lg"
              :disabled="!hasChanges"
            >
              Save Changes
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <UModal v-model:open="showChangePassword" :dismissible="!isChangingPassword">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30"
              >
                <Icon name="i-heroicons-key" class="w-6 h-6" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Update your account password
                </p>
              </div>
            </div>
          </template>

            <div class="space-y-4">
              <UFormField label="Current Password" required>
                <UInput
                  v-model="passwordForm.current"
                  type="password"
                  size="lg"
                  icon="i-heroicons-lock-closed"
                  placeholder="Enter current password" class="w-full"
                />
              </UFormField>

              <UFormField label="New Password" required>
                <UInput
                  v-model="passwordForm.new"
                  type="password"
                  size="lg"
                  icon="i-heroicons-key"
                  placeholder="Enter new password (min 8 characters)" class="w-full"
                />
              </UFormField>

              <UFormField label="Confirm New Password" required>
                <UInput
                  v-model="passwordForm.confirm"
                  type="password"
                  size="lg"
                  icon="i-heroicons-key"
                  placeholder="Confirm new password" class="w-full"
                />
              </UFormField>

              <UAlert
                icon="i-heroicons-information-circle"
                color="primary"
                variant="soft"
                description="Your password must be at least 8 characters long and include a mix of letters, numbers, and symbols."
              />
            </div>

          <template #footer>
            <div class="flex items-center justify-end gap-3">
              <UButton
                @click="showChangePassword = false"
                variant="ghost"
                color="neutral"
                :disabled="isChangingPassword"
              >
                Cancel
              </UButton>
              <UButton
                @click="changePassword"
                icon="i-heroicons-check"
                :loading="isChangingPassword"
                color="primary"
              >
                Change Password
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
