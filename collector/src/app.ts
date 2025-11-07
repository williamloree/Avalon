import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { config } from './config/env';
import errorRoutes from './routes/error.routes';
import testRoutes from './routes/test.routes';
import authRoutes from './routes/auth.routes';
import apiKeyRoutes from './routes/apiKey.routes';
import settingsRoutes from './routes/settings.routes';
import cors from "cors"

export function createApp(): Application {
  const app = express();
  app.use(cors())

  app.use(helmet());
  app.use(morgan('tiny'));
  app.use(bodyParser.json({ limit: config.bodyLimit }));

  app.use('/auth', authRoutes);
  app.use('/api-keys', apiKeyRoutes);
  app.use('/settings', settingsRoutes);
  app.use('/', errorRoutes);
  app.use('/', testRoutes);

  return app;
}
