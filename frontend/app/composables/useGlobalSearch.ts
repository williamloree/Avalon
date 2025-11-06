export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'error' | 'service' | 'release' | 'page' | 'doc';
  url: string;
  icon: string;
  metadata?: Record<string, any>;
}

export const useGlobalSearch = () => {
  const searchQuery = useState<string>('globalSearchQuery', () => '');
  const isSearchOpen = useState<boolean>('isSearchOpen', () => false);
  const searchResults = useState<SearchResult[]>('searchResults', () => []);
  const isSearching = useState<boolean>('isSearching', () => false);

  // Static pages for search
  const pages: SearchResult[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Overview of errors and system metrics',
      type: 'page',
      url: '/',
      icon: 'i-heroicons-home',
    },
    {
      id: 'errors',
      title: 'Issues',
      description: 'Browse and manage all application errors',
      type: 'page',
      url: '/errors',
      icon: 'i-heroicons-exclamation-triangle',
    },
    {
      id: 'performance',
      title: 'Performance',
      description: 'Monitor application performance metrics',
      type: 'page',
      url: '/performance',
      icon: 'i-heroicons-chart-bar',
    },
    {
      id: 'releases',
      title: 'Releases',
      description: 'Track deployments and version history',
      type: 'page',
      url: '/releases',
      icon: 'i-heroicons-rocket-launch',
    },
    {
      id: 'services',
      title: 'Services',
      description: 'Manage your services for error reporting',
      type: 'page',
      url: '/services',
      icon: 'i-heroicons-server-stack',
    },
    {
      id: 'docs',
      title: 'Documentation',
      description: 'Learn how to use Avalon Error Manager',
      type: 'doc',
      url: '/docs',
      icon: 'i-heroicons-book-open',
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'Manage your account settings',
      type: 'page',
      url: '/profile',
      icon: 'i-heroicons-user',
    },
    {
      id: 'support',
      title: 'Support',
      description: 'Get help and contact support',
      type: 'page',
      url: '/support',
      icon: 'i-heroicons-question-mark-circle',
    },
  ];

  const search = async (query: string) => {
    console.log('[useGlobalSearch] search called with query:', query);
    searchQuery.value = query;

    if (!query || query.trim().length === 0) {
      // Show all pages when no query
      console.log('[useGlobalSearch] Empty query, showing all pages:', pages.length);
      searchResults.value = pages;
      console.log('[useGlobalSearch] searchResults after setting pages:', searchResults.value.length);
      return;
    }

    isSearching.value = true;
    console.log('[useGlobalSearch] isSearching set to true');

    try {
      const lowerQuery = query.toLowerCase();
      const results: SearchResult[] = [];

      // Search in pages
      const pageResults = pages.filter(
        (page) =>
          page.title.toLowerCase().includes(lowerQuery) ||
          page.description.toLowerCase().includes(lowerQuery)
      );
      console.log('[useGlobalSearch] Found page results:', pageResults.length);
      results.push(...pageResults);

      // Search in errors (if we have access to error API)
      try {
        const { fetchErrors } = useErrorApi();
        const errors = await fetchErrors({ take: 100, skip: 0 });

        const errorResults = errors
          .filter(
            (error) =>
              error.message?.toLowerCase().includes(lowerQuery) ||
              error.service.toLowerCase().includes(lowerQuery) ||
              error.id.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 5) // Limit to 5 error results
          .map((error) => ({
            id: error.id,
            title: error.message || 'Unknown Error',
            description: `${error.service} • ${error.level}`,
            type: 'error' as const,
            url: `/errors?search=${encodeURIComponent(error.id)}`,
            icon: 'i-heroicons-exclamation-triangle',
            metadata: { error },
          }));

        results.push(...errorResults);
        console.log('[useGlobalSearch] Found error results:', errorResults.length);
      } catch (e) {
        console.warn('Could not search errors:', e);
      }

      console.log('[useGlobalSearch] Total results before limit:', results.length);
      searchResults.value = results.slice(0, 10); // Limit total results
      console.log('[useGlobalSearch] searchResults after setting:', searchResults.value.length);
    } catch (error) {
      console.error('Search error:', error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
      console.log('[useGlobalSearch] isSearching set to false');
    }
  };

  const openSearch = () => {
    isSearchOpen.value = true;
    // Show all pages by default when opening
    if (!searchQuery.value || searchQuery.value.trim().length === 0) {
      searchResults.value = pages;
    }
  };

  const closeSearch = () => {
    isSearchOpen.value = false;
    searchQuery.value = '';
    searchResults.value = [];
  };

  const clearSearch = () => {
    searchQuery.value = '';
    searchResults.value = [];
  };

  return {
    searchQuery,
    isSearchOpen,
    searchResults,
    isSearching,
    search,
    openSearch,
    closeSearch,
    clearSearch,
  };
};
