<script setup lang="ts">
import type { ErrorEvent } from "~/types";

interface Notification {
  id: string;
  error: ErrorEvent;
  timestamp: number;
}

// État des notifications
const notifications = ref<Notification[]>([]);
const maxNotifications = 5;
const notificationDuration = 5000; // 5 secondes

// WebSocket
const { onError, isConnected, connectionError } = useWebSocket();
const { success } = useCustomToast();

// Écouter les nouvelles erreurs
onMounted(() => {
  const unsubscribe = onError((error) => {
    addNotification(error);
  });

  // Nettoyer lors du démontage
  onUnmounted(() => {
    unsubscribe();
  });
});

// Ajouter une notification
const addNotification = (error: ErrorEvent) => {
  const notification: Notification = {
    id: `${error.id}-${Date.now()}`,
    error,
    timestamp: Date.now(),
  };

  notifications.value = [notification, ...notifications.value].slice(
    0,
    maxNotifications
  );

  // Retirer automatiquement après la durée définie
  setTimeout(() => {
    removeNotification(notification.id);
  }, notificationDuration);

  // Toast pour les erreurs critiques
  if (error.level === "fatal" || error.level === "error") {
    success(`New ${error.level} error from ${error.service}`);
  }
};

// Retirer une notification
const removeNotification = (id: string) => {
  notifications.value = notifications.value.filter((n) => n.id !== id);
};

// Obtenir la couleur selon le niveau
const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    fatal: "red",
    error: "red",
    warning: "orange",
    info: "blue",
    debug: "gray",
  };
  return colors[level] || "gray";
};

// Obtenir l'icône selon le niveau
const getLevelIcon = (level: string) => {
  const icons: Record<string, string> = {
    fatal: "i-heroicons-fire",
    error: "i-heroicons-exclamation-circle",
    warning: "i-heroicons-exclamation-triangle",
    info: "i-heroicons-information-circle",
    debug: "i-heroicons-bug-ant",
  };
  return icons[level] || "i-heroicons-bell";
};

// Formater le temps écoulé
const getTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
};

// Réactiver le timer pour mettre à jour le temps
const timeAgoUpdater = ref(0);

// Lancer le timer côté client uniquement
if (process.client) {
  setInterval(() => {
    timeAgoUpdater.value++;
  }, 1000);
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 w-96 space-y-2">
    <!-- Indicateur de connexion -->
    <div
      v-if="!isConnected"
      class="bg-orange-200 dark:bg-orange-900 border border-orange-400 dark:border-orange-800 rounded-lg p-3 shadow-lg animate-slide-in-right"
    >
      <div class="flex items-center gap-2">
        <Icon
          name="i-heroicons-wifi"
          class="w-5 h-5 text-orange-600 dark:text-orange-400"
        />
        <span class="text-sm font-medium text-orange-800 dark:text-orange-300">
          {{ connectionError ? 'Connection Error' : 'Connecting...' }}
        </span>
      </div>
      <p v-if="connectionError" class="text-xs text-orange-600 dark:text-orange-400 mt-1">
        {{ connectionError }}
      </p>
    </div>

    <!-- Indicateur de connexion réussie (temporaire) -->
    <!-- <Transition name="fade">
      <div
        v-if="isConnected && notifications.length === 0"
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 shadow-lg"
      >
        <div class="flex items-center gap-2">
          <Icon
            name="i-heroicons-check-circle"
            class="w-5 h-5 text-green-600 dark:text-green-400"
          />
          <span class="text-sm font-medium text-green-800 dark:text-green-300">
            Real-time monitoring active
          </span>
        </div>
      </div>
    </Transition> -->

    <!-- Liste des notifications -->
    <TransitionGroup name="list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden animate-slide-in-right"
      >
        <div
          class="p-4"
          :class="{
            'border-l-4': true,
            'border-red-500': notification.error.level === 'fatal' || notification.error.level === 'error',
            'border-orange-500': notification.error.level === 'warning',
            'border-blue-500': notification.error.level === 'info',
            'border-gray-500': notification.error.level === 'debug',
          }"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 flex-1">
              <Icon
                :name="getLevelIcon(notification.error.level)"
                class="w-5 h-5 shrink-0 mt-0.5"
                :class="{
                  'text-red-600': notification.error.level === 'fatal' || notification.error.level === 'error',
                  'text-orange-600': notification.error.level === 'warning',
                  'text-blue-600': notification.error.level === 'info',
                  'text-gray-600': notification.error.level === 'debug',
                }"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <UBadge
                    variant="soft"
                    size="xs"
                  >
                    {{ notification.error.level }}
                  </UBadge>
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {{ notification.error.service }}
                  </span>
                </div>
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ notification.error.message }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ getTimeAgo(notification.timestamp) }}
                </p>
              </div>
            </div>
            <button
              @click="removeNotification(notification.id)"
              class="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Icon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>
        <!-- Barre de progression -->
        <div class="h-1 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            class="h-full transition-all"
            :class="{
              'bg-red-500': notification.error.level === 'fatal' || notification.error.level === 'error',
              'bg-orange-500': notification.error.level === 'warning',
              'bg-blue-500': notification.error.level === 'info',
              'bg-gray-500': notification.error.level === 'debug',
            }"
            :style="{
              width: `${Math.max(0, 100 - ((Date.now() - notification.timestamp) / notificationDuration) * 100)}%`,
            }"
          />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Animations */
.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Transitions de liste */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.list-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.list-move {
  transition: transform 0.3s ease;
}

/* Transition fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
