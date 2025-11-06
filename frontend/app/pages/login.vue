<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { login } = useAuth();
const { error: showError, success } = useCustomToast();

const username = ref("");
const password = ref("");
const isLoading = ref(false);
const error = ref("");

const handleLogin = async () => {
  error.value = "";

  if (!username.value || !password.value) {
    error.value = "Please enter username and password";
    return;
  }

  isLoading.value = true;

  try {
    const result = await login(username.value, password.value);

    if (result.success) {
      success("Login successful!");
      navigateTo("/");
    } else {
      error.value = result.error || "Login failed";
      showError(error.value);
    }
  } catch (e: any) {
    error.value = "An error occurred";
    showError(error.value);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative overflow-hidden"
  >
    <!-- Animated Background Circles -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <!-- Blue Circle 1 -->
      <div
        class="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-blob"
        style="top: 10%; left: 20%;"
      ></div>

      <!-- Green Circle 1 -->
      <div
        class="absolute w-96 h-96 bg-green-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"
        style="top: 60%; right: 20%;"
      ></div>

      <!-- Blue Circle 2 -->
      <div
        class="absolute w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-blob animation-delay-4000"
        style="bottom: 10%; left: 40%;"
      ></div>

      <!-- Green Circle 2 -->
      <div
        class="absolute w-72 h-72 bg-green-400/20 rounded-full blur-3xl animate-blob animation-delay-3000"
        style="top: 30%; right: 30%;"
      ></div>

      <!-- Purple Circle (mix of blue and green) -->
      <div
        class="absolute w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-1000"
        style="top: 50%; left: 50%; transform: translate(-50%, -50%);"
      ></div>
    </div>

    <UCard class="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
      <template #header>
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🛡️ Avalon
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Error Manager - Login
          </p>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label
            for="username"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Username:
          </label>
          <UInput
            id="username"
            v-model="username"
            type="text"
            placeholder="Enter your username"
            :disabled="isLoading"
            size="lg"
            autocomplete="username"
            class="w-full"
          />
        </div>

        <div>
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Password:
          </label>
          <UInput
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            :disabled="isLoading"
            size="lg"
            autocomplete="current-password"
            class="w-full"
          />
        </div>

        <div
          v-if="error"
          class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          :loading="isLoading"
          :disabled="isLoading"
        >
          {{ isLoading ? "Logging in..." : "Login" }}
        </UButton>
      </form>

      <template #footer>
        <div class="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Default credentials:</p>
          <p class="font-mono mt-1">
            <span class="font-semibold">admin</span> /
            <span class="font-semibold">passwordAdmin</span>
          </p>
        </div>
      </template>
    </UCard>
  </div>
</template>
