<script setup lang="ts">
import { useClipboard } from "@vueuse/core";

definePageMeta({
  layout: false,
});

// SEO
useHead({
  title: "Documentation - Avalon Error Manager",
  meta: [
    {
      name: "description",
      content: "Complete documentation for Avalon Error Manager",
    },
  ],
});

// State
const activeSection = ref("getting-started");
const searchQuery = ref("");
const colorMode = useColorMode();

const isDark = computed({
  get() {
    return colorMode.value === "dark";
  },
  set(value) {
    colorMode.preference = value ? "dark" : "light";
  },
});

// Sections navigation
const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "i-heroicons-rocket-launch",
  },
  {
    id: "error-levels",
    title: "Error Levels",
    icon: "i-heroicons-exclamation-triangle",
  },
  {
    id: "api-integration",
    title: "API Integration",
    icon: "i-heroicons-code-bracket",
  },
  { id: "features", title: "Features", icon: "i-heroicons-sparkles" },
  { id: "faq", title: "FAQ", icon: "i-heroicons-question-mark-circle" },
];

// Filtered sections based on search
const filteredSections = computed(() => {
  if (!searchQuery.value.trim()) return sections;
  const query = searchQuery.value.toLowerCase();
  return sections.filter((s) => s.title.toLowerCase().includes(query));
});

// FAQ items
const faqItems = [
  {
    label: "How do I integrate Avalon with my application?",
    content:
      "Send HTTP POST requests to the Avalon API endpoint with your error data. Check the API Integration section for detailed examples and best practices.",
    defaultOpen: false,
  },
  {
    label: "What happens if I lose the WebSocket connection?",
    content:
      "The system will show an 'Offline' status badge. You can continue viewing existing errors and use the Refresh button to manually reload data. The WebSocket will automatically attempt to reconnect.",
    defaultOpen: false,
  },
  {
    label: "Can I export error data?",
    content:
      "Currently, you can copy individual error IDs and details. Bulk export functionality is planned for a future release.",
    defaultOpen: false,
  },
  {
    label: "How long are errors stored?",
    content:
      "Error retention depends on your server configuration. Contact your system administrator for specific retention policies.",
    defaultOpen: false,
  },
  {
    label: "What browsers are supported?",
    content:
      "Avalon works best on modern browsers: Chrome, Firefox, Safari, and Edge (latest versions). WebSocket support is required for real-time features.",
    defaultOpen: false,
  },
];

// Scroll to section
const scrollToSection = (sectionId: string) => {
  activeSection.value = sectionId;
  const element = document.getElementById(sectionId);
  if (element) {
    const offset = 96; // Account for sticky header
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};

// Copy code
const { copy } = useClipboard();
const { success } = useCustomToast();

const copyCode = () => {
  const code = `{
  "service": "api-service",
  "level": "error",
  "error": {
    "message": "Database connection timeout",
    "stack": "Error: Connection timeout\\n  at Database.connect...",
    "path": "/api/users",
    "method": "GET"
  },
  "metadata": {
    "userId": "12345",
    "requestId": "req-abc-123",
    "environment": "production"
  }
}`;
  copy(code);
  success("Code copied to clipboard!");
};

// Track scroll position
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      });
    },
    {
      rootMargin: "-100px 0px -66%",
    }
  );

  sections.forEach((section) => {
    const element = document.getElementById(section.id);
    if (element) {
      observer.observe(element);
    }
  });

  onUnmounted(() => {
    observer.disconnect();
  });
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
    <!-- Top Navigation Bar -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl"
    >
      <div
        class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between"
      >
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600"
          >
            <Icon name="i-heroicons-shield-check" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="font-bold text-lg text-gray-900 dark:text-white">
              Avalon
            </h1>
            <p class="text-xs text-gray-500">Error Manager</p>
          </div>
        </NuxtLink>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <UButton to="/errors" variant="ghost" icon="i-heroicons-arrow-left">
            Back to App
          </UButton>

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
        </div>
      </div>
    </nav>

    <div class="pt-16">
      <!-- Hero Section -->
      <section
        class="relative overflow-hidden border-b border-gray-200 dark:border-gray-800"
      >
        <div
          class="absolute inset-0 bg-linear-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
        ></div>
        <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div class="relative max-w-7xl mx-auto px-6 py-20 lg:py-24">
          <div class="text-center">
            <div
              class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 mb-6"
            >
              <Icon
                name="i-heroicons-document-text"
                class="w-8 h-8 text-white"
              />
            </div>
            <h1
              class="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Documentation
            </h1>
            <p
              class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              Everything you need to know about Avalon Error Manager
            </p>

            <!-- Quick Links -->
            <div class="flex flex-wrap items-center justify-center gap-4 mt-8">
              <UButton
                size="lg"
                icon="i-heroicons-rocket-launch"
                @click="scrollToSection('getting-started')"
              >
                Get Started
              </UButton>
              <UButton
                size="lg"
                variant="outline"
                icon="i-heroicons-code-bracket"
                @click="scrollToSection('api-integration')"
              >
                API Reference
              </UButton>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-6 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Sidebar Navigation -->
          <aside class="lg:col-span-3">
            <div class="sticky top-24 space-y-8">
              <!-- Search -->
              <div>
                <UInput
                  v-model="searchQuery"
                  icon="i-heroicons-magnifying-glass"
                  placeholder="Search docs..."
                  size="lg"
                />
              </div>

              <!-- Navigation -->
              <nav class="space-y-1">
                <div
                  v-for="section in filteredSections"
                  :key="section.id"
                  class="space-y-1"
                >
                  <a
                    :href="`#${section.id}`"
                    class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                    :class="
                      activeSection === section.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    "
                    @click.prevent="scrollToSection(section.id)"
                  >
                    <Icon :name="section.icon" class="w-5 h-5 shrink-0" />
                    <span>{{ section.title }}</span>
                  </a>
                </div>
              </nav>
            </div>
          </aside>

          <!-- Main Content -->
          <main class="lg:col-span-9 space-y-16">
            <!-- Getting Started -->
            <section id="getting-started" class="scroll-mt-24">
              <div class="space-y-6">
                <div>
                  <div
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4"
                  >
                    <Icon name="i-heroicons-rocket-launch" class="w-4 h-4" />
                    Quick Start
                  </div>
                  <h2
                    class="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                  >
                    Getting Started
                  </h2>
                  <p class="text-lg text-gray-600 dark:text-gray-400">
                    Welcome to Avalon Error Manager, your comprehensive solution
                    for real-time error tracking and monitoring.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <UCard class="hover:shadow-lg transition-shadow">
                    <div class="flex items-start gap-4">
                      <div
                        class="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30"
                      >
                        <Icon
                          name="i-heroicons-bolt"
                          class="w-6 h-6 text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <div>
                        <h3
                          class="font-semibold text-gray-900 dark:text-white mb-1"
                        >
                          Real-time
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          WebSocket-based live tracking
                        </p>
                      </div>
                    </div>
                  </UCard>

                  <UCard class="hover:shadow-lg transition-shadow">
                    <div class="flex items-start gap-4">
                      <div
                        class="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30"
                      >
                        <Icon
                          name="i-heroicons-server-stack"
                          class="w-6 h-6 text-purple-600 dark:text-purple-400"
                        />
                      </div>
                      <div>
                        <h3
                          class="font-semibold text-gray-900 dark:text-white mb-1"
                        >
                          Multi-service
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Track all microservices
                        </p>
                      </div>
                    </div>
                  </UCard>

                  <UCard class="hover:shadow-lg transition-shadow">
                    <div class="flex items-start gap-4">
                      <div
                        class="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30"
                      >
                        <Icon
                          name="i-heroicons-chart-bar"
                          class="w-6 h-6 text-green-600 dark:text-green-400"
                        />
                      </div>
                      <div>
                        <h3
                          class="font-semibold text-gray-900 dark:text-white mb-1"
                        >
                          Analytics
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Deep error insights
                        </p>
                      </div>
                    </div>
                  </UCard>
                </div>

                <UCard>
                  <h3
                    class="text-xl font-semibold text-gray-900 dark:text-white mb-4"
                  >
                    Quick Setup
                  </h3>
                  <ol class="space-y-4">
                    <li class="flex gap-4">
                      <div
                        class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-sm shrink-0"
                      >
                        1
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          Navigate to Issues
                        </p>
                        <p
                          class="text-sm text-gray-600 dark:text-gray-400 mt-1"
                        >
                          Open the Issues page to view all application errors in
                          real-time
                        </p>
                      </div>
                    </li>
                    <li class="flex gap-4">
                      <div
                        class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-sm shrink-0"
                      >
                        2
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          Search & Filter
                        </p>
                        <p
                          class="text-sm text-gray-600 dark:text-gray-400 mt-1"
                        >
                          Use the search bar to quickly find specific errors
                        </p>
                      </div>
                    </li>
                    <li class="flex gap-4">
                      <div
                        class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-sm shrink-0"
                      >
                        3
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          View Details
                        </p>
                        <p
                          class="text-sm text-gray-600 dark:text-gray-400 mt-1"
                        >
                          Click any error to see full stack traces and metadata
                        </p>
                      </div>
                    </li>
                  </ol>
                </UCard>
              </div>
            </section>

            <!-- Error Levels -->
            <section id="error-levels" class="scroll-mt-24">
              <div class="space-y-6">
                <div>
                  <div
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium mb-4"
                  >
                    <Icon
                      name="i-heroicons-exclamation-triangle"
                      class="w-4 h-4"
                    />
                    Severity Levels
                  </div>
                  <h2
                    class="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                  >
                    Error Levels
                  </h2>
                  <p class="text-lg text-gray-600 dark:text-gray-400">
                    Understand the different severity levels and their visual
                    indicators.
                  </p>
                </div>

                <div class="space-y-3">
                  <div
                    class="p-4 rounded-xl border-l-4 border-red-600 bg-red-50 dark:bg-red-950/20"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-3 mb-2">
                          <UBadge color="error" variant="solid"
                            >Critical</UBadge
                          >
                          <span
                            class="text-sm font-mono text-gray-600 dark:text-gray-400"
                            >level: "critical"</span
                          >
                        </div>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                          System-critical errors requiring immediate action.
                          These errors can cause service disruption.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    class="p-4 rounded-xl border-l-4 border-red-900 bg-red-50 dark:bg-red-950/20"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-3 mb-2">
                          <UBadge color="error" variant="solid">Fatal</UBadge>
                          <span
                            class="text-sm font-mono text-gray-600 dark:text-gray-400"
                            >level: "fatal"</span
                          >
                        </div>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                          Fatal errors causing complete service failure or data
                          loss.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    class="p-4 rounded-xl border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-3 mb-2">
                          <UBadge color="error" variant="solid">Error</UBadge>
                          <span
                            class="text-sm font-mono text-gray-600 dark:text-gray-400"
                            >level: "error"</span
                          >
                        </div>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                          Standard errors that need investigation and fixing.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    class="p-4 rounded-xl border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-3 mb-2">
                          <UBadge color="warning" variant="solid"
                            >Warning</UBadge
                          >
                          <span
                            class="text-sm font-mono text-gray-600 dark:text-gray-400"
                            >level: "warning"</span
                          >
                        </div>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                          Warnings about potential issues that should be
                          reviewed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    class="p-4 rounded-xl border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-3 mb-2">
                          <UBadge color="info" variant="solid">Info</UBadge>
                          <span
                            class="text-sm font-mono text-gray-600 dark:text-gray-400"
                            >level: "info"</span
                          >
                        </div>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                          Informational messages for tracking application flow.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    class="p-4 rounded-xl border-l-4 border-gray-500 bg-gray-50 dark:bg-gray-800"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-3 mb-2">
                          <UBadge color="neutral" variant="solid">Debug</UBadge>
                          <span
                            class="text-sm font-mono text-gray-600 dark:text-gray-400"
                            >level: "debug"</span
                          >
                        </div>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                          Debug information for development and troubleshooting.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- API Integration -->
            <section id="api-integration" class="scroll-mt-24">
              <div class="space-y-6">
                <div>
                  <div
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4"
                  >
                    <Icon name="i-heroicons-code-bracket" class="w-4 h-4" />
                    Integration
                  </div>
                  <h2
                    class="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                  >
                    API Integration
                  </h2>
                  <p class="text-lg text-gray-600 dark:text-gray-400">
                    Learn how to integrate Avalon with your applications.
                  </p>
                </div>

                <UCard>
                  <h3
                    class="text-xl font-semibold text-gray-900 dark:text-white mb-4"
                  >
                    Sending Errors
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 mb-4">
                    Send a POST request to report errors from your application:
                  </p>

                  <div class="relative">
                    <div class="absolute top-4 right-4 z-10">
                      <UButton
                        size="xs"
                        variant="ghost"
                        icon="i-heroicons-clipboard-document"
                        @click="copyCode"
                      >
                        Copy
                      </UButton>
                    </div>
                    <pre
                      class="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm"
                    ><code>{
  "service": "api-service",
  "level": "error",
  "error": {
    "message": "Database connection timeout",
    "stack": "Error: Connection timeout\\n  at Database.connect...",
    "path": "/api/users",
    "method": "GET"
  },
  "metadata": {
    "userId": "12345",
    "requestId": "req-abc-123",
    "environment": "production"
  }
}</code></pre>
                  </div>
                </UCard>

                <UCard>
                  <h3
                    class="text-xl font-semibold text-gray-900 dark:text-white mb-4"
                  >
                    Request Fields
                  </h3>
                  <div class="space-y-3">
                    <div class="flex gap-3">
                      <code
                        class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-primary-600 dark:text-primary-400"
                        >service</code
                      >
                      <div>
                        <p
                          class="text-sm text-gray-900 dark:text-white font-medium"
                        >
                          Required
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Name of the service generating the error
                        </p>
                      </div>
                    </div>
                    <div class="flex gap-3">
                      <code
                        class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-primary-600 dark:text-primary-400"
                        >level</code
                      >
                      <div>
                        <p
                          class="text-sm text-gray-900 dark:text-white font-medium"
                        >
                          Required
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Error severity: critical, fatal, error, warning, info,
                          debug
                        </p>
                      </div>
                    </div>
                    <div class="flex gap-3">
                      <code
                        class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-primary-600 dark:text-primary-400"
                        >error.message</code
                      >
                      <div>
                        <p
                          class="text-sm text-gray-900 dark:text-white font-medium"
                        >
                          Required
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Human-readable error message
                        </p>
                      </div>
                    </div>
                    <div class="flex gap-3">
                      <code
                        class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-primary-600 dark:text-primary-400"
                        >error.stack</code
                      >
                      <div>
                        <p
                          class="text-sm text-gray-900 dark:text-white font-medium"
                        >
                          Optional
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Complete stack trace for debugging
                        </p>
                      </div>
                    </div>
                    <div class="flex gap-3">
                      <code
                        class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-primary-600 dark:text-primary-400"
                        >metadata</code
                      >
                      <div>
                        <p
                          class="text-sm text-gray-900 dark:text-white font-medium"
                        >
                          Optional
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Additional context data (user ID, request ID, etc.)
                        </p>
                      </div>
                    </div>
                  </div>
                </UCard>
              </div>
            </section>

            <!-- Features -->
            <section id="features" class="scroll-mt-24">
              <div class="space-y-6">
                <div>
                  <div
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4"
                  >
                    <Icon name="i-heroicons-sparkles" class="w-4 h-4" />
                    Features
                  </div>
                  <h2
                    class="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                  >
                    Key Features
                  </h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <UCard
                    class="hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div class="flex items-start gap-4">
                      <div
                        class="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 shrink-0"
                      >
                        <Icon
                          name="i-heroicons-magnifying-glass"
                          class="w-6 h-6 text-green-600 dark:text-green-400"
                        />
                      </div>
                      <div>
                        <h3
                          class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                        >
                          Smart Search
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Search across error messages, services, and IDs with
                          real-time filtering.
                        </p>
                      </div>
                    </div>
                  </UCard>

                  <UCard
                    class="hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div class="flex items-start gap-4">
                      <div
                        class="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0"
                      >
                        <Icon
                          name="i-heroicons-arrows-up-down"
                          class="w-6 h-6 text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <div>
                        <h3
                          class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                        >
                          Column Sorting
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Click any column header to sort errors by level, time,
                          service, or message.
                        </p>
                      </div>
                    </div>
                  </UCard>

                  <UCard
                    class="hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div class="flex items-start gap-4">
                      <div
                        class="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 shrink-0"
                      >
                        <Icon
                          name="i-heroicons-bolt"
                          class="w-6 h-6 text-purple-600 dark:text-purple-400"
                        />
                      </div>
                      <div>
                        <h3
                          class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                        >
                          Real-time Updates
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          WebSocket connection provides instant notifications
                          for new errors.
                        </p>
                      </div>
                    </div>
                  </UCard>

                  <UCard
                    class="hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div class="flex items-start gap-4">
                      <div
                        class="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0"
                      >
                        <Icon
                          name="i-heroicons-document-magnifying-glass"
                          class="w-6 h-6 text-orange-600 dark:text-orange-400"
                        />
                      </div>
                      <div>
                        <h3
                          class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                        >
                          Detailed View
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          View complete stack traces, metadata, and all error
                          context in one place.
                        </p>
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>
            </section>

            <!-- FAQ -->
            <section id="faq" class="scroll-mt-24">
              <div class="space-y-6">
                <div>
                  <div
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium mb-4"
                  >
                    <Icon
                      name="i-heroicons-question-mark-circle"
                      class="w-4 h-4"
                    />
                    Help
                  </div>
                  <h2
                    class="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                  >
                    Frequently Asked Questions
                  </h2>
                </div>

                <UAccordion :items="faqItems" :ui="{ wrapper: 'space-y-3' }" />
              </div>
            </section>
          </main>
        </div>
      </div>

      <!-- Footer -->
      <footer class="border-t border-gray-200 dark:border-gray-800 mt-24">
        <div class="max-w-7xl mx-auto px-6 py-12">
          <div
            class="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div
              class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
            >
              <Icon name="i-heroicons-document-text" class="w-5 h-5" />
              <span class="font-semibold">Avalon Error Manager</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-500">
              Built with Nuxt & Nuxt UI
            </p>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style>
.bg-grid-pattern {
  background-image: linear-gradient(
      to right,
      rgb(0 0 0 / 0.05) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, rgb(0 0 0 / 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}
</style>
