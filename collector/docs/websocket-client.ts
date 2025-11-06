/**
 * Client WebSocket Avalon pour applications TypeScript/JavaScript
 *
 * Installation:
 * npm install socket.io-client
 *
 * Usage:
 * import { AvalonWebSocketClient } from './websocket-client';
 *
 * const client = new AvalonWebSocketClient('http://localhost:3000');
 *
 * client.on('error', (error) => {
 *   console.log('New error:', error);
 * });
 *
 * client.connect();
 */

import { io, Socket } from 'socket.io-client';

export interface ErrorEventRecord {
  id: string;
  service: string;
  message: string | null;
  stack: string | null;
  path: string | null;
  method: string | null;
  level: string;
  metadata: any;
  createdAt: Date;
}

export type ErrorCallback = (error: ErrorEventRecord) => void;
export type ConnectionCallback = () => void;

export interface AvalonWebSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
}

export class AvalonWebSocketClient {
  private socket: Socket | null = null;
  private url: string;
  private options: AvalonWebSocketOptions;
  private errorCallbacks: ErrorCallback[] = [];
  private connectCallbacks: ConnectionCallback[] = [];
  private disconnectCallbacks: ConnectionCallback[] = [];

  constructor(url: string, options: AvalonWebSocketOptions = {}) {
    this.url = url;
    this.options = {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      ...options,
    };
  }

  /**
   * Se connecter au serveur WebSocket
   */
  connect(): void {
    if (this.socket?.connected) {
      console.warn('Already connected to Avalon WebSocket');
      return;
    }

    this.socket = io(this.url, {
      autoConnect: this.options.autoConnect,
      reconnection: this.options.reconnection,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionAttempts: this.options.reconnectionAttempts,
    });

    this.setupEventListeners();
    this.socket.connect();
  }

  /**
   * Se déconnecter du serveur WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Configuration des écouteurs d'événements
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to Avalon WebSocket');
      this.connectCallbacks.forEach(callback => callback());
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Avalon WebSocket');
      this.disconnectCallbacks.forEach(callback => callback());
    });

    this.socket.on('error:new', (error: ErrorEventRecord) => {
      this.errorCallbacks.forEach(callback => callback(error));
    });

    this.socket.on('error:service', (error: ErrorEventRecord) => {
      // Vous pouvez ajouter un traitement spécifique pour les erreurs de service
      console.log('Service error:', error);
    });

    this.socket.on('error:level', (error: ErrorEventRecord) => {
      // Vous pouvez ajouter un traitement spécifique pour les erreurs de niveau
      console.log('Level error:', error);
    });
  }

  /**
   * S'abonner à toutes les nouvelles erreurs
   */
  on(event: 'error', callback: ErrorCallback): void;
  on(event: 'connect', callback: ConnectionCallback): void;
  on(event: 'disconnect', callback: ConnectionCallback): void;
  on(event: string, callback: any): void {
    switch (event) {
      case 'error':
        this.errorCallbacks.push(callback);
        break;
      case 'connect':
        this.connectCallbacks.push(callback);
        break;
      case 'disconnect':
        this.disconnectCallbacks.push(callback);
        break;
      default:
        console.warn(`Unknown event: ${event}`);
    }
  }

  /**
   * Se désabonner d'un événement
   */
  off(event: 'error', callback: ErrorCallback): void;
  off(event: 'connect', callback: ConnectionCallback): void;
  off(event: 'disconnect', callback: ConnectionCallback): void;
  off(event: string, callback: any): void {
    switch (event) {
      case 'error':
        this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
        break;
      case 'connect':
        this.connectCallbacks = this.connectCallbacks.filter(cb => cb !== callback);
        break;
      case 'disconnect':
        this.disconnectCallbacks = this.disconnectCallbacks.filter(cb => cb !== callback);
        break;
      default:
        console.warn(`Unknown event: ${event}`);
    }
  }

  /**
   * S'abonner aux erreurs d'un service spécifique
   */
  subscribeToService(serviceName: string): void {
    if (!this.socket) {
      console.warn('Not connected to WebSocket');
      return;
    }
    this.socket.emit('subscribe:service', serviceName);
  }

  /**
   * Se désabonner des erreurs d'un service spécifique
   */
  unsubscribeFromService(serviceName: string): void {
    if (!this.socket) {
      console.warn('Not connected to WebSocket');
      return;
    }
    this.socket.emit('unsubscribe:service', serviceName);
  }

  /**
   * S'abonner aux erreurs d'un niveau spécifique
   */
  subscribeToLevel(level: string): void {
    if (!this.socket) {
      console.warn('Not connected to WebSocket');
      return;
    }
    this.socket.emit('subscribe:level', level);
  }

  /**
   * Se désabonner des erreurs d'un niveau spécifique
   */
  unsubscribeFromLevel(level: string): void {
    if (!this.socket) {
      console.warn('Not connected to WebSocket');
      return;
    }
    this.socket.emit('unsubscribe:level', level);
  }

  /**
   * Vérifier si le client est connecté
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtenir l'instance Socket.IO brute (pour des usages avancés)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export par défaut pour faciliter l'importation
export default AvalonWebSocketClient;
