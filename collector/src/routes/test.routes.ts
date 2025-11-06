import { Router, Request, Response } from 'express';
import { databaseService } from '../services/database.service';
import { discordService } from '../services/discord.service';
import { loggerService } from '../services/logger.service';
import { websocketService } from '../services/websocket.service';
import type { ErrorPayload, ApiResponse } from '../types';

const router = Router();

// Helper function to send test error
async function sendTestError(payload: ErrorPayload, res: Response) {
  try {
    const record = await databaseService.saveEvent(payload);
    loggerService.logErrorToFile(record);
    await discordService.sendErrorNotification(record);

    // 🔥 Diffuser l'erreur via WebSocket en temps réel
    websocketService.sendErrorNotification(record);

    const response: ApiResponse = {
      status: 'ok',
      id: record.id,
      message: `Test ${payload.level} error sent successfully via WebSocket`,
    };
    res.status(201).json(response);
  } catch (err: any) {
    console.error('Test error:', err);
    const response: ApiResponse = { status: 'error', message: err.message };
    res.status(500).json(response);
  }
}

router.get('/test/critical', async (_req: Request, res: Response) => {
  await sendTestError(
    {
      service: 'test-service',
      error: {
        message: 'Critical system failure - Database unavailable',
        stack: 'Error: Connection refused\n  at Database.connect (db.ts:45)\n  at Server.init (server.ts:12)',
        path: '/api/database',
        method: 'GET',
      },
      level: 'critical',
    },
    res
  );
});

router.get('/test/fatal', async (_req: Request, res: Response) => {
  await sendTestError(
    {
      service: 'test-service',
      error: {
        message: 'Fatal error - Application crashed',
        stack: 'FatalError: Out of memory\n  at Process.allocate (process.ts:89)\n  at Worker.run (worker.ts:234)',
        path: '/api/worker',
        method: 'POST',
      },
      level: 'fatal',
    },
    res
  );
});

router.get('/test/error', async (_req: Request, res: Response) => {
  await sendTestError(
    {
      service: 'test-service',
      error: {
        message: 'Payment processing failed',
        stack: 'Error: Transaction timeout\n  at PaymentGateway.charge (payment.ts:156)\n  at OrderService.process (order.ts:78)',
        path: '/api/checkout',
        method: 'POST',
      },
      level: 'error',
    },
    res
  );
});

router.get('/test/warning', async (_req: Request, res: Response) => {
  await sendTestError(
    {
      service: 'test-service',
      error: {
        message: 'High memory usage detected - 85% utilization',
        path: '/health',
        method: 'GET',
      },
      level: 'warning',
    },
    res
  );
});

router.get('/test/info', async (_req: Request, res: Response) => {
  await sendTestError(
    {
      service: 'test-service',
      error: {
        message: 'User authentication successful',
        path: '/api/login',
        method: 'POST',
      },
      level: 'info',
    },
    res
  );
});

router.get('/test/debug', async (_req: Request, res: Response) => {
  await sendTestError(
    {
      service: 'test-service',
      error: {
        message: 'Debug: Request processed in 234ms',
        path: '/api/users',
        method: 'GET',
      },
      level: 'debug',
    },
    res
  );
});

router.get('/test/all', async (_req: Request, res: Response) => {
  try {
    const testErrors: ErrorPayload[] = [
      {
        service: 'test-service',
        error: {
          message: 'Critical system failure - Database unavailable',
          stack: 'Error: Connection refused\n  at Database.connect (db.ts:45)\n  at Server.init (server.ts:12)',
          path: '/api/database',
          method: 'GET',
        },
        level: 'critical',
      },
      {
        service: 'test-service',
        error: {
          message: 'Fatal error - Application crashed',
          stack: 'FatalError: Out of memory\n  at Process.allocate (process.ts:89)\n  at Worker.run (worker.ts:234)',
          path: '/api/worker',
          method: 'POST',
        },
        level: 'fatal',
      },
      {
        service: 'test-service',
        error: {
          message: 'Payment processing failed',
          stack: 'Error: Transaction timeout\n  at PaymentGateway.charge (payment.ts:156)\n  at OrderService.process (order.ts:78)',
          path: '/api/checkout',
          method: 'POST',
        },
        level: 'error',
      },
      {
        service: 'test-service',
        error: {
          message: 'High memory usage detected - 85% utilization',
          path: '/health',
          method: 'GET',
        },
        level: 'warning',
      },
      {
        service: 'test-service',
        error: {
          message: 'User authentication successful',
          path: '/api/login',
          method: 'POST',
        },
        level: 'info',
      },
      {
        service: 'test-service',
        error: {
          message: 'Debug: Request processed in 234ms',
          path: '/api/users',
          method: 'GET',
        },
        level: 'debug',
      },
    ];

    const results = [];

    for (const errorPayload of testErrors) {
      const record = await databaseService.saveEvent(errorPayload);
      loggerService.logErrorToFile(record);
      await discordService.sendErrorNotification(record);

      // 🔥 Diffuser l'erreur via WebSocket en temps réel
      websocketService.sendErrorNotification(record);

      results.push({
        level: record.level,
        id: record.id,
        message: record.message,
      });
    }

    res.json({
      status: 'ok',
      message: 'All test errors have been sent via WebSocket',
      results,
    });
  } catch (err: any) {
    console.error('Test error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
