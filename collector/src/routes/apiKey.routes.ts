import { Router, Request, Response } from 'express';
import { apiKeyService } from '../services/apiKey.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes API Keys nécessitent une authentification
router.use(authMiddleware);

/**
 * GET /api-keys
 * Récupérer toutes les API Keys
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const apiKeys = await apiKeyService.getAllApiKeys();

    return res.json({
      status: 'ok',
      apiKeys,
    });
  } catch (error: any) {
    console.error('Get API keys error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api-keys/:id
 * Récupérer une API Key par ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const apiKey = await apiKeyService.getApiKeyById(id);

    if (!apiKey) {
      return res.status(404).json({
        status: 'error',
        message: 'API Key not found',
      });
    }

    return res.json({
      status: 'ok',
      apiKey,
    });
  } catch (error: any) {
    console.error('Get API key error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api-keys
 * Créer une nouvelle API Key
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, service } = req.body;
    const userId = req.user!.userId;

    // Validation
    if (!name || !service) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and service are required',
      });
    }

    const apiKey = await apiKeyService.createApiKey({
      name,
      service,
      createdById: userId,
    });

    return res.status(201).json({
      status: 'ok',
      apiKey,
      message: 'API Key created successfully. Make sure to copy the key now, you won\'t be able to see it again.',
    });
  } catch (error: any) {
    console.error('Create API key error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * PUT /api-keys/:id
 * Mettre à jour une API Key
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, service, isActive } = req.body;

    // Validation
    if (!name && !service && isActive === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'No data provided for update',
      });
    }

    const apiKey = await apiKeyService.updateApiKey(id, {
      name,
      service,
      isActive,
    });

    return res.json({
      status: 'ok',
      apiKey,
      message: 'API Key updated successfully',
    });
  } catch (error: any) {
    console.error('Update API key error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api-keys/:id/regenerate
 * Régénérer une API Key
 */
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const apiKey = await apiKeyService.regenerateApiKey(id);

    return res.json({
      status: 'ok',
      apiKey,
      message: 'API Key regenerated successfully. Make sure to copy the new key now, you won\'t be able to see it again.',
    });
  } catch (error: any) {
    console.error('Regenerate API key error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * DELETE /api-keys/:id
 * Supprimer une API Key
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await apiKeyService.deleteApiKey(id);

    return res.json({
      status: 'ok',
      message: 'API Key deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete API key error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

export default router;
