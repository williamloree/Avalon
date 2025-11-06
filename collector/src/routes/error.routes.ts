import { Router, Request, Response } from 'express';
import { databaseService } from '../services/database.service';
import { discordService } from '../services/discord.service';
import { loggerService } from '../services/logger.service';
import { websocketService } from '../services/websocket.service';
import { apiKeyMiddleware } from '../middleware/apiKey.middleware';
import { config } from '../config/env';
import type { ErrorPayload, GetErrorsQuery, ApiResponse } from '../types';

const router = Router();

router.post('/report', apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    const payload: ErrorPayload = req.body || {};

    // Utiliser le service de l'API Key au lieu du service fourni dans le payload
    // Cela empêche les clients de falsifier le nom du service
    const service = req.apiKey!.service;

    const record = await databaseService.saveEvent({
      ...payload,
      service, // Forcer le service à celui de l'API Key
    });

    loggerService.logErrorToFile(record);

    // Envoyer la notification Discord (async)
    await discordService.sendErrorNotification(record);

    // Envoyer la notification WebSocket en temps réel
    websocketService.sendErrorNotification(record);

    const response: ApiResponse = { status: 'ok', id: record.id };
    res.status(201).json(response);
  } catch (err: any) {
    console.error('Avalon error:', err);
    const response: ApiResponse = { status: 'error', message: err.message };
    res.status(500).json(response);
  }
});

router.get('/errors', async (req: Request<{}, {}, {}, GetErrorsQuery>, res: Response) => {
  try {
    const take = Math.min(
      parseInt(req.query.take || String(config.defaultErrorsPerPage)),
      config.maxErrorsPerPage
    );
    const skip = parseInt(req.query.skip || '0');

    const items = await databaseService.getErrors(take, skip);

    const response: ApiResponse = { status: 'ok', items };
    res.json(response);
  } catch (err: any) {
    console.error(err);
    const response: ApiResponse = { status: 'error', message: err.message };
    res.status(500).json(response);
  }
});

router.delete('/errors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await databaseService.deleteError(id);

    const response: ApiResponse = { status: 'ok', message: 'Error deleted successfully' };
    res.json(response);
  } catch (err: any) {
    console.error(err);
    const response: ApiResponse = { status: 'error', message: err.message };
    res.status(500).json(response);
  }
});

router.delete('/errors', async (_req: Request, res: Response) => {
  try {
    const count = await databaseService.deleteAllErrors();

    const response: ApiResponse = { status: 'ok', message: `${count} error(s) deleted successfully` };
    res.json(response);
  } catch (err: any) {
    console.error(err);
    const response: ApiResponse = { status: 'error', message: err.message };
    res.status(500).json(response);
  }
});

router.delete('/errors/service/:service', async (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const count = await databaseService.deleteErrorsByService(service);

    const response: ApiResponse = { status: 'ok', message: `${count} error(s) deleted for service ${service}` };
    res.json(response);
  } catch (err: any) {
    console.error(err);
    const response: ApiResponse = { status: 'error', message: err.message };
    res.status(500).json(response);
  }
});

router.get('/', (_req: Request, res: Response) => {
  res.send('Avalon - Error Collector is running.');
});

export default router;
