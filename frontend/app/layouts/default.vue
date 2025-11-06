<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Animated Background Circles -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none" style="z-index: 0;">
      <!-- Blue Circle 1 -->
      <div
        class="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob"
        style="top: 10%; left: 20%;"
      ></div>

      <!-- Green Circle 1 -->
      <div
        class="absolute w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-blob-reverse animation-delay-2000"
        style="top: 60%; right: 20%;"
      ></div>

      <!-- Blue Circle 2 -->
      <div
        class="absolute w-80 h-80 bg-blue-400/15 rounded-full blur-3xl animate-blob animation-delay-4000"
        style="bottom: 10%; left: 40%;"
      ></div>

      <!-- Green Circle 2 -->
      <div
        class="absolute w-72 h-72 bg-green-400/15 rounded-full blur-3xl animate-blob-slow animation-delay-3000"
        style="top: 30%; right: 30%;"
      ></div>

      <!-- Purple Circle (mix of blue and green) -->
      <div
        class="absolute w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-blob-reverse animation-delay-1000"
        style="top: 50%; left: 50%; transform: translate(-50%, -50%);"
      ></div>
    </div>

    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div class="pl-64">
      <!-- Header -->
      <AppHeader />

      <!-- Page Content -->
      <main class="pt-16 min-h-screen">
        <slot />
      </main>
    </div>

    <!-- Global Notifications -->
    <!-- <UNotifications /> -->

    <!-- Real-time Error Notifications -->
    <RealtimeNotification />

    <!-- Global Search Modal -->
    <GlobalSearchModal />
  </div>
</template>
