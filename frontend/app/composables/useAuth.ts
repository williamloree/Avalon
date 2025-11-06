export const useAuth = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  const token = useCookie('auth_token', {
    maxAge: 60 * 60 * 24, // 24 heures
    sameSite: 'lax',
  });

  const user = useState<{ id: string; username: string } | null>('user', () => null);
  const isAuthenticated = computed(() => !!token.value && !!user.value);

  /**
   * Se connecter
   */
  const login = async (username: string, password: string) => {
    try {
      const response = await $fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        body: { username, password },
      });

      if (response.status === 'ok' && response.token) {
        token.value = response.token;
        user.value = response.user;
        return { success: true };
      }

      return { success: false, error: 'Invalid response from server' };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.data?.message || 'Login failed',
      };
    }
  };

  /**
   * Se déconnecter
   */
  const logout = () => {
    token.value = null;
    user.value = null;
    navigateTo('/login');
  };

  /**
   * Vérifier le token au chargement
   */
  const verifyToken = async () => {
    if (!token.value) {
      user.value = null;
      return false;
    }

    try {
      const response = await $fetch(`${apiBase}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });

      if (response.status === 'ok' && response.user) {
        user.value = response.user;
        return true;
      }

      // Token invalide
      token.value = null;
      user.value = null;
      return false;
    } catch (error) {
      // Token invalide ou expiré
      token.value = null;
      user.value = null;
      return false;
    }
  };

  /**
   * Mettre à jour le profil utilisateur
   */
  const updateProfile = async (data: {
    username?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    try {
      const response = await $fetch(`${apiBase}/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        body: data,
      });

      if (response.status === 'ok' && response.user) {
        user.value = response.user;
        return { success: true };
      }

      return { success: false, error: 'Invalid response from server' };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.data?.message || 'Update failed',
      };
    }
  };

  return {
    token: readonly(token),
    user: readonly(user),
    isAuthenticated,
    login,
    logout,
    verifyToken,
    updateProfile,
  };
};
