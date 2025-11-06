import { io, Socket } from 'socket.io-client'
import type { ErrorEvent } from '~/types'

// État global pour le socket (partagé entre tous les composants)
let socket: Socket | null = null
const isConnected = ref(false)
const connectionError = ref<string | null>(null)
const lastError = ref<ErrorEvent | null>(null)

// Callbacks d'événements
const errorCallbacks = new Set<(error: ErrorEvent) => void>()
const connectionCallbacks = new Set<(connected: boolean) => void>()

export const useWebSocket = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  /**
   * Initialise la connexion WebSocket
   */
  const connect = () => {
    if (socket?.connected) {
      console.log('WebSocket already connected')
      return
    }

    if (socket) {
      socket.connect()
      return
    }

    // Créer une nouvelle connexion
    socket = io(apiBase, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    // Événement de connexion
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket?.id)
      isConnected.value = true
      connectionError.value = null

      // Notifier tous les callbacks
      connectionCallbacks.forEach(cb => cb(true))
    })

    // Événement de déconnexion
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      isConnected.value = false

      // Notifier tous les callbacks
      connectionCallbacks.forEach(cb => cb(false))
    })

    // Événement d'erreur de connexion
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      connectionError.value = error.message
      isConnected.value = false
    })

    // Événement: Nouvelle erreur (broadcast à tous les clients)
    socket.on('error:new', (error: ErrorEvent) => {
      console.log('New error received via WebSocket:', error)
      lastError.value = error

      // Notifier tous les callbacks
      errorCallbacks.forEach(cb => cb(error))
    })

    // Événement: Erreur pour un service spécifique
    socket.on('error:service', (error: ErrorEvent) => {
      console.log('Service error received via WebSocket:', error)
      lastError.value = error

      // Notifier tous les callbacks
      errorCallbacks.forEach(cb => cb(error))
    })

    // Événement: Erreur pour un niveau spécifique
    socket.on('error:level', (error: ErrorEvent) => {
      console.log('Level error received via WebSocket:', error)
      lastError.value = error

      // Notifier tous les callbacks
      errorCallbacks.forEach(cb => cb(error))
    })
  }

  /**
   * Déconnecte le WebSocket
   */
  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      console.log('WebSocket disconnected manually')
    }
  }

  /**
   * S'abonner à un service spécifique
   */
  const subscribeToService = (serviceName: string) => {
    if (socket?.connected) {
      socket.emit('subscribe:service', serviceName)
      console.log(`Subscribed to service: ${serviceName}`)
    }
  }

  /**
   * Se désabonner d'un service
   */
  const unsubscribeFromService = (serviceName: string) => {
    if (socket?.connected) {
      socket.emit('unsubscribe:service', serviceName)
      console.log(`Unsubscribed from service: ${serviceName}`)
    }
  }

  /**
   * S'abonner à un niveau de log spécifique
   */
  const subscribeToLevel = (level: string) => {
    if (socket?.connected) {
      socket.emit('subscribe:level', level)
      console.log(`Subscribed to level: ${level}`)
    }
  }

  /**
   * Se désabonner d'un niveau de log
   */
  const unsubscribeFromLevel = (level: string) => {
    if (socket?.connected) {
      socket.emit('unsubscribe:level', level)
      console.log(`Unsubscribed from level: ${level}`)
    }
  }

  /**
   * Enregistrer un callback pour les nouvelles erreurs
   */
  const onError = (callback: (error: ErrorEvent) => void) => {
    errorCallbacks.add(callback)

    // Retourner une fonction pour se désinscrire
    return () => {
      errorCallbacks.delete(callback)
    }
  }

  /**
   * Enregistrer un callback pour les changements de connexion
   */
  const onConnectionChange = (callback: (connected: boolean) => void) => {
    connectionCallbacks.add(callback)

    // Retourner une fonction pour se désinscrire
    return () => {
      connectionCallbacks.delete(callback)
    }
  }

  return {
    // État
    isConnected: readonly(isConnected),
    connectionError: readonly(connectionError),
    lastError: readonly(lastError),

    // Méthodes
    connect,
    disconnect,
    subscribeToService,
    unsubscribeFromService,
    subscribeToLevel,
    unsubscribeFromLevel,
    onError,
    onConnectionChange,
  }
}
