import crypto from 'crypto';
import { databaseService } from './database.service';

interface CreateApiKeyData {
  name: string;
  service: string;
  createdById: string;
}

interface ApiKeyRecord {
  id: string;
  name: string;
  key: string;
  service: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

class ApiKeyService {
  /**
   * Générer une clé API unique
   */
  private generateApiKey(): string {
    // Format: avl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (36 caractères après le préfixe)
    const randomBytes = crypto.randomBytes(27); // 27 bytes = 54 hex chars, on prendra 36
    const key = randomBytes.toString('hex').substring(0, 36);
    return `avl_${key}`;
  }

  /**
   * Créer une nouvelle API Key
   */
  async createApiKey(data: CreateApiKeyData): Promise<ApiKeyRecord> {
    const key = this.generateApiKey();

    const apiKey = await databaseService.createApiKey({
      name: data.name,
      key,
      service: data.service,
      createdById: data.createdById,
    });

    return apiKey;
  }

  /**
   * Vérifier si une API Key est valide
   */
  async verifyApiKey(key: string): Promise<{ valid: boolean; service?: string; apiKeyId?: string }> {
    try {
      const apiKey = await databaseService.findApiKeyByKey(key);

      if (!apiKey) {
        return { valid: false };
      }

      if (!apiKey.isActive) {
        return { valid: false };
      }

      // Mettre à jour la date de dernière utilisation (sans attendre)
      databaseService.updateApiKeyLastUsed(apiKey.id).catch((err) => {
        console.error('Failed to update lastUsedAt:', err);
      });

      return {
        valid: true,
        service: apiKey.service,
        apiKeyId: apiKey.id,
      };
    } catch (error) {
      console.error('Error verifying API key:', error);
      return { valid: false };
    }
  }

  /**
   * Récupérer toutes les API Keys
   */
  async getAllApiKeys(): Promise<ApiKeyRecord[]> {
    return await databaseService.getAllApiKeys();
  }

  /**
   * Récupérer une API Key par ID
   */
  async getApiKeyById(id: string): Promise<ApiKeyRecord | null> {
    return await databaseService.getApiKeyById(id);
  }

  /**
   * Mettre à jour une API Key
   */
  async updateApiKey(
    id: string,
    data: { name?: string; service?: string; isActive?: boolean }
  ): Promise<ApiKeyRecord> {
    return await databaseService.updateApiKey(id, data);
  }

  /**
   * Supprimer une API Key
   */
  async deleteApiKey(id: string): Promise<void> {
    await databaseService.deleteApiKey(id);
  }

  /**
   * Régénérer une API Key
   */
  async regenerateApiKey(id: string): Promise<ApiKeyRecord> {
    const newKey = this.generateApiKey();
    return await databaseService.updateApiKey(id, { key: newKey });
  }
}

export const apiKeyService = new ApiKeyService();
