import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  discordEnabled: process.env.DISCORD_ENABLED === 'true',
  databaseUrl: process.env.DATABASE_URL,
  logFilePath: 'errors.log',
  bodyLimit: '200kb',
  maxErrorsPerPage: 100,
  defaultErrorsPerPage: 50,
  discordMessageMaxLength: 1900,
} as const;
