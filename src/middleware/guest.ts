/**
 * Guest middleware
 * Redirects to home if user is already authenticated
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const loadingStore = useLoadingStore()

  // Check if user is already logged in
  if (loadingStore.userLoggedin) {
    return navigateTo('/')
  }
})
