/**
 * Authentication middleware
 * Redirects to login if user is not authenticated
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const loadingStore = useLoadingStore()

  // Check if user is logged in
  if (!loadingStore.userLoggedin) {
    return navigateTo('/account/login')
  }
})
