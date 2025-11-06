<script setup lang="ts">
useHead({
  title: "Help & Support - Avalon Error Manager",
  meta: [
    {
      name: "description",
      content: "Get help and support for Avalon Error Manager",
    },
  ],
});

// State
const isSubmitting = ref(false);
const supportForm = ref({
  subject: "",
  category: "technical",
  description: "",
});

// Popular Topics
const popularTopics = [
  {
    title: "Getting Started",
    description: "Learn how to set up Avalon for your application",
    icon: "i-heroicons-rocket-launch",
    color: "blue",
    link: "/docs#getting-started",
  },
  {
    title: "Integration Guide",
    description: "Connect Avalon with your tech stack",
    icon: "i-heroicons-puzzle-piece",
    color: "purple",
    link: "/docs#api-integration",
  },
  {
    title: "API Reference",
    description: "Complete API documentation",
    icon: "i-heroicons-code-bracket",
    color: "green",
    link: "/docs#api-integration",
  },
  {
    title: "Troubleshooting",
    description: "Solutions to common problems",
    icon: "i-heroicons-wrench-screwdriver",
    color: "orange",
    link: "/docs#faq",
  },
];

// Form Options
const categoryOptions = [
  { label: "Technical Issue", value: "technical" },
  { label: "Feature Request", value: "feature" },
  { label: "Integration Help", value: "integration" },
  { label: "Bug Report", value: "bug" },
  { label: "Other", value: "other" },
];

// FAQ Items
const faqItems = [
  {
    label: "How do I integrate Avalon with my application?",
    content:
      "Check out our Integration Guide in the documentation. You'll need to install the SDK for your platform and configure it with your service API key from the Services page.",
    defaultOpen: false,
  },
  {
    label: "What's the difference between error levels?",
    content:
      "Avalon supports 6 levels: Debug (development), Info (informational), Warning (potential issues), Error (standard errors), Critical (urgent), and Fatal (service failure). Each has different notification settings.",
    defaultOpen: false,
  },
  {
    label: "How long are errors stored?",
    content:
      "By default, errors are kept for 30 days. You can configure this in Settings under Data Management, from 1 to 365 days based on your needs.",
    defaultOpen: false,
  },
  {
    label: "Can I export error data?",
    content:
      "Yes! You can export errors in CSV or JSON format from the Issues page using the export button in the top-right corner.",
    defaultOpen: false,
  },
];

// Methods
const submitSupportRequest = async () => {
  if (
    !supportForm.value.subject ||
    !supportForm.value.category ||
    !supportForm.value.description
  ) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Please fill in all required fields",
      color: "red",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const toast = useToast();
    toast.add({
      title: "Request Submitted",
      description: "We'll get back to you soon!",
      color: "green",
      icon: "i-heroicons-check-circle",
    });
    resetForm();
  } catch (e: any) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to submit request",
      color: "red",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  supportForm.value = {
    subject: "",
    category: "technical",
    description: "",
  };
};

// Get color classes for topics
const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; icon: string; gradient: string }> = {
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/20",
      icon: "text-blue-600 dark:text-blue-400",
      gradient: "from-blue-500 to-blue-600 shadow-blue-500/30",
    },
    purple: {
      bg: "bg-purple-100 dark:bg-purple-900/20",
      icon: "text-purple-600 dark:text-purple-400",
      gradient: "from-purple-500 to-purple-600 shadow-purple-500/30",
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900/20",
      icon: "text-green-600 dark:text-green-400",
      gradient: "from-green-500 to-green-600 shadow-green-500/30",
    },
    orange: {
      bg: "bg-orange-100 dark:bg-orange-900/20",
      icon: "text-orange-600 dark:text-orange-400",
      gradient: "from-orange-500 to-orange-600 shadow-orange-500/30",
    },
  };
  return colors[color] || colors.blue;
};
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="mx-auto space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Help & Support
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Get help with Avalon Error Manager
        </p>
      </div>

      <!-- Popular Topics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NuxtLink
          v-for="topic in popularTopics"
          :key="topic.title"
          :to="topic.link"
          class="group"
        >
          <UCard class="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="flex flex-col items-center text-center space-y-4">
              <div
                class="w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                :class="getColorClasses(topic.color).gradient"
              >
                <Icon :name="topic.icon" class="w-8 h-8" />
              </div>
              <div>
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {{ topic.title }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ topic.description }}
                </p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Contact Support Form -->
        <div class="lg:col-span-2">
          <UCard class="group hover:shadow-xl transition-all duration-300">
            <template #header>
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                >
                  <Icon name="i-heroicons-envelope" class="w-6 h-6" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Contact Support
                  </h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Send us a message and we'll get back to you
                  </p>
                </div>
              </div>
            </template>

            <form @submit.prevent="submitSupportRequest" class="space-y-4">
              <UFormField label="Subject" required>
                <UInput
                  v-model="supportForm.subject"
                  size="lg"
                  icon="i-heroicons-chat-bubble-left-ellipsis"
                  placeholder="Brief description of your issue" class="w-full"
                />
              </UFormField>

              <UFormField label="Category" required>
                <USelect
                  v-model="supportForm.category"
                  :items="categoryOptions"
                  size="lg"
                  icon="i-heroicons-tag" class="w-full"
                />
              </UFormField>

              <UFormField label="Description" required>
                <UTextarea
                  v-model="supportForm.description"
                  :rows="6"
                  placeholder="Please describe your issue in detail..." class="w-full"
                />
              </UFormField>

              <div class="flex items-center justify-end gap-3 pt-4">
                <UButton
                  type="button"
                  @click="resetForm"
                  variant="ghost"
                  color="neutral"
                  icon="i-heroicons-arrow-path"
                >
                  Clear
                </UButton>
                <UButton
                  type="submit"
                  icon="i-heroicons-paper-airplane"
                  :loading="isSubmitting"
                  color="primary"
                  size="lg"
                >
                  Send Request
                </UButton>
              </div>
            </form>
          </UCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Links -->
          <UCard class="group hover:shadow-xl transition-all duration-300">
            <template #header>
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30"
                >
                  <Icon name="i-heroicons-link" class="w-5 h-5" />
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  Quick Links
                </h3>
              </div>
            </template>

            <div class="space-y-2">
              <UButton
                to="/docs"
                block
                variant="soft"
                color="blue"
                icon="i-heroicons-book-open"
                size="lg"
                class="justify-start"
              >
                Documentation
              </UButton>
              <UButton
                to="/services"
                block
                variant="soft"
                color="purple"
                icon="i-heroicons-server-stack"
                size="lg"
                class="justify-start"
              >
                Services
              </UButton>
              <UButton
                to="/settings"
                block
                variant="soft"
                color="green"
                icon="i-heroicons-cog-6-tooth"
                size="lg"
                class="justify-start"
              >
                Settings
              </UButton>
            </div>
          </UCard>

          <!-- Contact Info -->
          <UCard class="group hover:shadow-xl transition-all duration-300">
            <template #header>
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30"
                >
                  <Icon name="i-heroicons-phone" class="w-5 h-5" />
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  Contact Info
                </h3>
              </div>
            </template>

            <div class="space-y-4">
              <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <Icon
                  name="i-heroicons-envelope"
                  class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Email Support
                  </p>
                  <a
                    href="mailto:support@avalon.dev"
                    class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    support@avalon.dev
                  </a>
                </div>
              </div>

              <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <Icon
                  name="i-heroicons-chat-bubble-left-right"
                  class="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Live Chat
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Mon-Fri, 9AM-5PM
                  </p>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- FAQ -->
      <UCard class="group hover:shadow-xl transition-all duration-300">
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
            >
              <Icon name="i-heroicons-question-mark-circle" class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Frequently Asked Questions
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Quick answers to common questions
              </p>
            </div>
          </div>
        </template>

        <UAccordion :items="faqItems" />
      </UCard>
    </div>
  </div>
</template>
