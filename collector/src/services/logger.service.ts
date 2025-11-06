import fs from 'fs';
import { config } from '../config/env';
import type { ErrorEventRecord } from '../types';

class LoggerService {
  private logFilePath: string;

  constructor() {
    this.logFilePath = config.logFilePath;
  }

  logErrorToFile(record: ErrorEventRecord): void {
    try {
      const line = JSON.stringify({
        id: record.id,
        service: record.service,
        message: record.message,
        createdAt: record.createdAt,
      }) + '\n';

      fs.appendFileSync(this.logFilePath, line);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
}

export const loggerService = new LoggerService();
