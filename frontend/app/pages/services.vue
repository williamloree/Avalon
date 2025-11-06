<script setup lang="ts">
// SEO
useHead({
  title: "Services - Avalon Error Manager",
  meta: [
    {
      name: "description",
      content: "Manage your services for error reporting",
    },
  ],
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const { success, error: showError } = useCustomToast();
const { token } = useAuth();

// State
const apiKeys = ref<any[]>([]);
const isLoading = ref(false);
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const showRegenerateModal = ref(false);
const showKeyModal = ref(false);
const selectedKey = ref<any>(null);
const newlyCreatedKey = ref("");

const createForm = ref({
  name: "",
  service: "",
});

// Fetch API keys
const fetchApiKeys = async () => {
  isLoading.value = true;
  try {
    const response = await $fetch(`${apiBase}/api-keys`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (response.status === "ok") {
      apiKeys.value = response.apiKeys;
    }
  } catch (e: any) {
    showError("Failed to fetch API keys: " + (e.data?.message || e.message));
  } finally {
    isLoading.value = false;
  }
};

// Create API key
const createApiKey = async () => {
  if (!createForm.value.name || !createForm.value.service) {
    showError("Name and service are required");
    return;
  }

  try {
    const response = await $fetch(`${apiBase}/api-keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: createForm.value,
    });

    if (response.status === "ok") {
      newlyCreatedKey.value = response.apiKey.key;
      showKeyModal.value = true;
      showCreateModal.value = false;
      createForm.value = { name: "", service: "" };
      await fetchApiKeys();
      success("API Key created successfully");
    }
  } catch (e: any) {
    showError("Failed to create API key: " + (e.data?.message || e.message));
  }
};

// Toggle API key status
const toggleApiKey = async (apiKey: any) => {
  try {
    const response = await $fetch(`${apiBase}/api-keys/${apiKey.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: {
        isActive: !apiKey.isActive,
      },
    });

    if (response.status === "ok") {
      await fetchApiKeys();
      success(
        `API Key ${apiKey.isActive ? "deactivated" : "activated"} successfully`
      );
    }
  } catch (e: any) {
    showError("Failed to update API key: " + (e.data?.message || e.message));
  }
};

// Regenerate API key
const regenerateApiKey = async () => {
  if (!selectedKey.value) return;

  try {
    const response = await $fetch(
      `${apiBase}/api-keys/${selectedKey.value.id}/regenerate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      }
    );

    if (response.status === "ok") {
      newlyCreatedKey.value = response.apiKey.key;
      showRegenerateModal.value = false;
      showKeyModal.value = true;
      await fetchApiKeys();
      success("API Key regenerated successfully");
    }
  } catch (e: any) {
    showError(
      "Failed to regenerate API key: " + (e.data?.message || e.message)
    );
  }
};

// Delete API key
const deleteApiKey = async () => {
  if (!selectedKey.value) return;

  try {
    const response = await $fetch(
      `${apiBase}/api-keys/${selectedKey.value.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      }
    );

    if (response.status === "ok") {
      showDeleteModal.value = false;
      selectedKey.value = null;
      await fetchApiKeys();
      success("API Key deleted successfully");
    }
  } catch (e: any) {
    showError("Failed to delete API key: " + (e.data?.message || e.message));
  }
};

// Copy key to clipboard
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    success("Copied to clipboard");
  } catch (e) {
    showError("Failed to copy to clipboard");
  }
};

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Load API keys on mount
onMounted(() => {
  fetchApiKeys();
});
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Services
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage services and API keys for your applications to report errors
        </p>
      </div>
      <UButton icon="i-heroicons-plus" @click="showCreateModal = true">
        Add Service
      </UButton>
    </div>

    <!-- Services Table -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-gray-900 dark:text-white">
          Your Services
        </h2>
      </template>

      <div v-if="isLoading" class="flex justify-center py-12">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 animate-spin text-primary-500"
        />
      </div>

      <div v-else-if="apiKeys.length === 0" class="text-center py-12">
        <UIcon
          name="i-heroicons-server-stack"
          class="w-16 h-16 mx-auto text-gray-400 mb-4"
        />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Services
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Create your first service to start reporting errors
        </p>
        <UButton @click="showCreateModal = true" icon="i-heroicons-plus">
          Add Service
        </UButton>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white"
              >
                Name
              </th>
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white"
              >
                Service
              </th>
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white"
              >
                Key
              </th>
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white"
              >
                Status
              </th>
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white"
              >
                Last Used
              </th>
              <th
                class="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white"
              >
                Created
              </th>
              <th
                class="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="apiKey in apiKeys"
              :key="apiKey.id"
              class="border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <td class="py-3 px-4">
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ apiKey.name }}
                </div>
              </td>
              <td class="py-3 px-4">
                <UBadge color="primary" variant="soft">{{
                  apiKey.service
                }}</UBadge>
              </td>
              <td class="py-3 px-4">
                <code class="text-xs font-mono text-gray-600 dark:text-gray-400"
                  >{{ apiKey.key.substring(0, 12) }}...</code
                >
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="apiKey.isActive ? 'green' : 'gray'"
                  variant="soft"
                >
                  {{ apiKey.isActive ? "Active" : "Inactive" }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {{
                  apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : "Never"
                }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(apiKey.createdAt) }}
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    icon="i-heroicons-clipboard-document"
                    variant="ghost"
                    size="sm"
                    square
                    @click="copyToClipboard(apiKey.key)"
                    title="Copy key"
                  />
                  <UButton
                    :icon="
                      apiKey.isActive ? 'i-heroicons-pause' : 'i-heroicons-play'
                    "
                    variant="ghost"
                    size="sm"
                    square
                    @click="toggleApiKey(apiKey)"
                    :title="apiKey.isActive ? 'Deactivate' : 'Activate'"
                  />
                  <UButton
                    icon="i-heroicons-arrow-path"
                    variant="ghost"
                    size="sm"
                    square
                    @click="
                      selectedKey = apiKey;
                      showRegenerateModal = true;
                    "
                    title="Regenerate"
                  />
                  <UButton
                    icon="i-heroicons-trash"
                    variant="ghost"
                    color="red"
                    size="sm"
                    square
                    @click="
                      selectedKey = apiKey;
                      showDeleteModal = true;
                    "
                    title="Delete"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Create Modal -->
    <UModal v-model:open="showCreateModal">
      <template #content>
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Add New Service
          </h2>

          <div class="space-y-4">
            <UFormField label="Service Display Name">
              <UInput
                v-model="createForm.name"
                placeholder="My Application"
                size="md"
              />
              <template #help>
                A friendly name to identify this service
              </template>
            </UFormField>

            <UFormField label="Service Identifier">
              <UInput
                v-model="createForm.service"
                placeholder="my-app"
                size="md"
              />
              <template #help>
                Unique identifier used to filter and group errors from this
                service
              </template>
            </UFormField>
          </div>

          <div class="flex items-center justify-end gap-3 mt-6">
            <UButton
              @click="showCreateModal = false"
              variant="ghost"
              color="neutral"
            >
              Cancel
            </UButton>
            <UButton @click="createApiKey"> Create Service </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Show Key Modal -->
    <UModal v-model:open="showKeyModal">
      <template #content>
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Your API Key
          </h2>

          <div
            class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4"
          >
            <p class="text-sm text-yellow-800 dark:text-yellow-200">
              Make sure to copy your API key now. You won't be able to see it
              again!
            </p>
          </div>

          <div class="space-y-4">
            <div
              class="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm break-all"
            >
              {{ newlyCreatedKey }}
            </div>

            <UButton
              block
              icon="i-heroicons-clipboard-document"
              @click="copyToClipboard(newlyCreatedKey)"
            >
              Copy to Clipboard
            </UButton>
          </div>

          <div class="flex items-center justify-end gap-3 mt-6">
            <UButton
              @click="
                showKeyModal = false;
                newlyCreatedKey = '';
              "
              variant="ghost"
            >
              Done
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Regenerate Modal -->
    <UModal v-model:open="showRegenerateModal">
      <template #content>
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Regenerate API Key
          </h2>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to regenerate this API key? The old key will
            immediately stop working.
          </p>

          <div class="flex items-center justify-end gap-3">
            <UButton
              @click="showRegenerateModal = false"
              variant="ghost"
              color="neutral"
            >
              Cancel
            </UButton>
            <UButton @click="regenerateApiKey" color="orange">
              Regenerate
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Delete API Key
          </h2>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to delete this API key? This action cannot be
            undone.
          </p>

          <div class="flex items-center justify-end gap-3">
            <UButton
              @click="showDeleteModal = false"
              variant="ghost"
              color="neutral"
            >
              Cancel
            </UButton>
            <UButton @click="deleteApiKey" color="red"> Delete </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
