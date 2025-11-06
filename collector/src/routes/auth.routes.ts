import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /auth/login
 * Authentifier un utilisateur
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required',
      });
    }

    // Authentification
    const result = await authService.login(username, password);

    if (!result) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    return res.json({
      status: 'ok',
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * GET /auth/verify
 * Vérifier un token JWT
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided',
      });
    }

    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
    }

    return res.json({
      status: 'ok',
      user: {
        userId: decoded.userId,
        username: decoded.username,
      },
    });
  } catch (error: any) {
    console.error('Verify error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * PUT /auth/profile
 * Mettre à jour le profil utilisateur
 */
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { username, currentPassword, newPassword } = req.body;

    // Validation
    if (!username && !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'No data provided for update',
      });
    }

    // Si changement de mot de passe, le mot de passe actuel est requis
    if (newPassword && !currentPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is required to change password',
      });
    }

    // Mettre à jour le profil
    const result = await authService.updateProfile(userId, {
      username,
      currentPassword,
      newPassword,
    });

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error || 'Failed to update profile',
      });
    }

    return res.json({
      status: 'ok',
      user: result.user,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

export default router;
