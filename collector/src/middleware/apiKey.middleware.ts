import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/apiKey.service';

// Étendre le type Request pour inclure les informations de l'API Key
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        service: string;
        apiKeyId: string;
      };
    }
  }
}

/**
 * Middleware pour vérifier l'API Key sur les routes /report
 */
export const apiKeyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Récupérer l'API Key depuis le header X-API-Key
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        status: 'error',
        message: 'API Key is required. Please provide a valid API Key in the X-API-Key header.',
      });
      return;
    }

    // Vérifier l'API Key
    const result = await apiKeyService.verifyApiKey(apiKey);

    if (!result.valid || !result.service || !result.apiKeyId) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or inactive API Key.',
      });
      return;
    }

    // Ajouter les informations de l'API Key à la requête
    req.apiKey = {
      service: result.service,
      apiKeyId: result.apiKeyId,
    };

    next();
  } catch (error) {
    console.error('API Key middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
    return;
  }
};
