import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type { ErrorEventRecord } from '../types';

class WebSocketService {
  private io: SocketIOServer | null = null;

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*', // À configurer selon vos besoins de sécurité
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });

      // Événement pour s'abonner à un service spécifique
      socket.on('subscribe:service', (serviceName: string) => {
        socket.join(`service:${serviceName}`);
        console.log(`Client ${socket.id} subscribed to service: ${serviceName}`);
      });

      // Événement pour se désabonner d'un service
      socket.on('unsubscribe:service', (serviceName: string) => {
        socket.leave(`service:${serviceName}`);
        console.log(`Client ${socket.id} unsubscribed from service: ${serviceName}`);
      });

      // Événement pour s'abonner à un niveau de log spécifique
      socket.on('subscribe:level', (level: string) => {
        socket.join(`level:${level}`);
        console.log(`Client ${socket.id} subscribed to level: ${level}`);
      });

      // Événement pour se désabonner d'un niveau de log
      socket.on('unsubscribe:level', (level: string) => {
        socket.leave(`level:${level}`);
        console.log(`Client ${socket.id} unsubscribed from level: ${level}`);
      });
    });

    console.log('WebSocket service initialized');
  }

  /**
   * Envoie une notification d'erreur à tous les clients connectés
   */
  sendErrorNotification(record: ErrorEventRecord): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }

    // Envoyer à tous les clients
    this.io.emit('error:new', record);

    // Envoyer aux clients abonnés au service spécifique
    this.io.to(`service:${record.service}`).emit('error:service', record);

    // Envoyer aux clients abonnés au niveau de log spécifique
    this.io.to(`level:${record.level}`).emit('error:level', record);
  }

  /**
   * Envoie une statistique ou mise à jour générale
   */
  sendUpdate(event: string, data: any): void {
    if (!this.io) {
      console.warn('WebSocket not initialized');
      return;
    }

    this.io.emit(event, data);
  }

  /**
   * Retourne le nombre de clients connectés
   */
  getConnectedClients(): number {
    return this.io?.engine.clientsCount || 0;
  }
}

export const websocketService = new WebSocketService();
