export default defineNuxtRouteMiddleware(async (to) => {
  // Pages publiques (pas besoin d'authentification)
  const publicPages = ['/login'];
  const isPublicPage = publicPages.includes(to.path);

  // Vérifier l'authentification
  const { isAuthenticated, verifyToken } = useAuth();

  // Si pas authentifié, vérifier le token
  if (!isAuthenticated.value) {
    const isValid = await verifyToken();

    if (!isValid && !isPublicPage) {
      // Rediriger vers la page de login si on essaie d'accéder à une page protégée
      return navigateTo('/login');
    }
  }

  // Si authentifié et qu'on essaie d'accéder à la page de login, rediriger vers le dashboard
  if (isAuthenticated.value && to.path === '/login') {
    return navigateTo('/');
  }
});
