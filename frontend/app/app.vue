<script setup lang="ts">
// Initialiser la connexion WebSocket au démarrage de l'application
const { connect, disconnect, isConnected } = useWebSocket()

// Connecter au WebSocket lors du montage
onMounted(() => {
  console.log('Initializing WebSocket connection...')
  connect()
})

// Déconnecter lors du démontage
onUnmounted(() => {
  console.log('Disconnecting WebSocket...')
  disconnect()
})

// Log l'état de connexion
watch(isConnected, (connected) => {
  console.log('WebSocket connection status:', connected ? 'Connected' : 'Disconnected')
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(80px, -50px) scale(1.15);
  }
  50% {
    transform: translate(-60px, 70px) scale(0.85);
  }
  75% {
    transform: translate(100px, 30px) scale(1.08);
  }
}

@keyframes blobReverse {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(-70px, 60px) scale(0.9);
  }
  50% {
    transform: translate(90px, -40px) scale(1.12);
  }
  75% {
    transform: translate(-50px, -80px) scale(0.95);
  }
}

@keyframes blobSlow {
  0%, 100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  33% {
    transform: translate(50px, -70px) scale(1.1) rotate(120deg);
  }
  66% {
    transform: translate(-80px, 40px) scale(0.88) rotate(240deg);
  }
}

.animate-blob {
  animation: blob 25s ease-in-out infinite;
}

.animate-blob-reverse {
  animation: blobReverse 22s ease-in-out infinite;
}

.animate-blob-slow {
  animation: blobSlow 30s ease-in-out infinite;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-3000 {
  animation-delay: 3s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
