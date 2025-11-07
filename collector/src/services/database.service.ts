import { PrismaClient } from '@prisma/client';
import type { ErrorPayload, ErrorEventRecord } from '../types';

class DatabaseService {
  private _prisma: PrismaClient;

  constructor() {
    this._prisma = new PrismaClient();
  }

  get prisma(): PrismaClient {
    return this._prisma;
  }

  async saveEvent(payload: ErrorPayload): Promise<ErrorEventRecord> {
    try {
      const created = await this._prisma.errorEvent.create({
        data: {
          service: payload.service || 'unknown-service',
          message: payload.error?.message || null,
          stack: payload.error?.stack || null,
          path: payload.error?.path || null,
          method: payload.error?.method || null,
          metadata: payload.metadata ? payload.metadata : undefined,
          level: payload.level || 'error',
        },
      });
      return created as ErrorEventRecord;
    } catch (error) {
      console.error('Failed to save to DB:', error);
      throw error;
    }
  }

  async getErrors(take: number, skip: number): Promise<ErrorEventRecord[]> {
    try {
      const items = await this._prisma.errorEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });
      return items as ErrorEventRecord[];
    } catch (error) {
      console.error('Failed to fetch errors from DB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this._prisma.$disconnect();
  }

  // Méthodes pour les utilisateurs
  async findUserByUsername(username: string) {
    return await this._prisma.user.findUnique({
      where: { username },
    });
  }

  async getUserById(userId: string) {
    return await this._prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async createUser(username: string, hashedPassword: string) {
    return await this._prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
  }

  async updateUser(userId: string, data: { username?: string; password?: string }) {
    return await this._prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  // Méthodes pour les API Keys
  async createApiKey(data: { name: string; key: string; service: string; createdById: string }) {
    return await this._prisma.apiKey.create({
      data,
    });
  }

  async findApiKeyByKey(key: string) {
    return await this._prisma.apiKey.findUnique({
      where: { key },
    });
  }

  async getAllApiKeys() {
    return await this._prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async getApiKeyById(id: string) {
    return await this._prisma.apiKey.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async updateApiKey(id: string, data: { name?: string; key?: string; service?: string; isActive?: boolean }) {
    return await this._prisma.apiKey.update({
      where: { id },
      data,
    });
  }

  async deleteApiKey(id: string) {
    return await this._prisma.apiKey.delete({
      where: { id },
    });
  }

  async updateApiKeyLastUsed(id: string) {
    return await this._prisma.apiKey.update({
      where: { id },
      data: {
        lastUsedAt: new Date(),
      },
    });
  }

  // Méthodes pour la suppression des erreurs
  async deleteError(id: string): Promise<void> {
    try {
      await this._prisma.errorEvent.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Failed to delete error from DB:', error);
      throw error;
    }
  }

  async deleteAllErrors(): Promise<number> {
    try {
      const result = await this._prisma.errorEvent.deleteMany({});
      return result.count;
    } catch (error) {
      console.error('Failed to delete all errors from DB:', error);
      throw error;
    }
  }

  async deleteErrorsByService(service: string): Promise<number> {
    try {
      const result = await this._prisma.errorEvent.deleteMany({
        where: { service },
      });
      return result.count;
    } catch (error) {
      console.error('Failed to delete errors by service from DB:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
