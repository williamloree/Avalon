import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

// Étendre le type Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}

/**
 * Middleware pour protéger les routes avec JWT
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        status: 'error',
        message: 'No authorization header provided',
      });
      return;
    }

    // Vérifier le format "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        status: 'error',
        message: 'Invalid authorization header format. Expected: Bearer <token>',
      });
      return;
    }

    const token = parts[1];

    // Vérifier le token
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Ajouter les informations de l'utilisateur à la requête
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
    return;
  }
};
