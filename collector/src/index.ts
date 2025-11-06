import { createApp } from './app';
import { config } from './config/env';
import { databaseService } from './services/database.service';
import { websocketService } from './services/websocket.service';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Avalon listening on port ${config.port}`);

  // Initialiser le WebSocket après le démarrage du serveur HTTP
  websocketService.initialize(server);
});

process.on('SIGINT', async () => {
  console.log('Avalon shutting down, disconnecting database...');
  await databaseService.disconnect();
  server.close(() => {
    console.log('Avalon server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('Avalon received SIGTERM, shutting down gracefully...');
  await databaseService.disconnect();
  server.close(() => {
    console.log('Avalon server closed');
    process.exit(0);
  });
});
