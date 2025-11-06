import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { databaseService } from './database.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '24h';

interface TokenPayload {
  userId: string;
  username: string;
}

class AuthService {
  /**
   * Authentifier un utilisateur
   */
  async login(username: string, password: string): Promise<{ token: string; user: { id: string; username: string } } | null> {
    try {
      // Récupérer l'utilisateur
      const user = await databaseService.findUserByUsername(username);

      if (!user) {
        return null;
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      // Générer le token JWT
      const payload: TokenPayload = {
        userId: user.id,
        username: user.username,
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      };
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  }

  /**
   * Vérifier un token JWT
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Créer un utilisateur (utile pour le seed)
   */
  async createUser(username: string, password: string): Promise<{ id: string; username: string }> {
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await databaseService.createUser(username, hashedPassword);

    return {
      id: user.id,
      username: user.username,
    };
  }

  /**
   * Vérifier si un utilisateur existe
   */
  async userExists(username: string): Promise<boolean> {
    const user = await databaseService.findUserByUsername(username);

    return !!user;
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(userId: string, data: { username?: string; currentPassword?: string; newPassword?: string }): Promise<{ success: boolean; user?: { id: string; username: string }; error?: string }> {
    try {
      // Récupérer l'utilisateur actuel
      const user = await databaseService.getUserById(userId);

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Si changement de mot de passe, vérifier le mot de passe actuel
      if (data.newPassword) {
        if (!data.currentPassword) {
          return { success: false, error: 'Current password is required to change password' };
        }

        const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
        if (!isPasswordValid) {
          return { success: false, error: 'Current password is incorrect' };
        }
      }

      // Vérifier si le nouveau username est déjà utilisé
      if (data.username && data.username !== user.username) {
        const existingUser = await databaseService.findUserByUsername(data.username);
        if (existingUser) {
          return { success: false, error: 'Username already taken' };
        }
      }

      // Préparer les données à mettre à jour
      const updateData: any = {};
      if (data.username) {
        updateData.username = data.username;
      }
      if (data.newPassword) {
        updateData.password = await bcrypt.hash(data.newPassword, 10);
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await databaseService.updateUser(userId, updateData);

      return {
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
        },
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }
}

export const authService = new AuthService();
