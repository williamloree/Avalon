interface Settings {
  id: string;
  discordWebhookUrl: string | null;
  discordEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UpdateSettingsDto {
  discordWebhookUrl?: string | null;
  discordEnabled?: boolean;
}

export const useSettings = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const { token } = useAuth();

  const settings = useState<Settings | null>('settings', () => null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Récupérer les settings depuis l'API
   */
  const fetchSettings = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<Settings>(`${apiBase}/settings`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });

      settings.value = response;
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Fetch settings error:', err);
      error.value = err.data?.message || 'Failed to fetch settings';
      return {
        success: false,
        error: error.value,
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Mettre à jour les settings
   */
  const updateSettings = async (data: UpdateSettingsDto) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<Settings>(`${apiBase}/settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        body: data,
      });

      settings.value = response;
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Update settings error:', err);
      error.value = err.data?.message || 'Failed to update settings';
      return {
        success: false,
        error: error.value,
      };
    } finally {
      loading.value = false;
    }
  };

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    error: readonly(error),
    fetchSettings,
    updateSettings,
  };
};
