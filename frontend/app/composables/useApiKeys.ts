export const useApiKeys = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const { token } = useAuth();

  const fetchApiKeys = async () => {
    try {
      const response = await $fetch(`${apiBase}/api-keys`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });

      if (response.status === 'ok') {
        return response.apiKeys;
      }

      return [];
    } catch (error: any) {
      console.error('Failed to fetch API keys:', error);
      return [];
    }
  };

  return {
    fetchApiKeys,
  };
};
