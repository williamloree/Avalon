import { Router, Request, Response } from 'express';
import { settingsService } from '../services/settings.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Récupérer les settings
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      error: 'Failed to fetch settings',
      message: error.message,
    });
  }
});

// Mettre à jour les settings
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { discordWebhookUrl, discordEnabled } = req.body;

    const updatedSettings = await settingsService.updateSettings({
      discordWebhookUrl,
      discordEnabled,
    });

    res.json(updatedSettings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      error: 'Failed to update settings',
      message: error.message,
    });
  }
});

export default router;
