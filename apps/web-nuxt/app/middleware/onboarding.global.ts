export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/api'))
    return

  const authResponse = await $fetch<{ authenticated: boolean }>('/api/auth/me').catch(() => ({ authenticated: false }))
  const publicPaths = new Set(['/', '/verify', '/login', '/reset-password'])
  if (!authResponse.authenticated && !publicPaths.has(to.path))
    return navigateTo('/login')

  if (authResponse.authenticated && to.path === '/login')
    return navigateTo('/signatures/new')

  if (!authResponse.authenticated)
    return

  const allowedWhenLocked = new Set(['/onboarding'])
  const { onboardingRequired } = await $fetch<{ onboardingRequired: boolean }>('/api/onboarding/state')
  const onboardingState = useState<boolean>('onboarding-required')
  onboardingState.value = onboardingRequired

  if (onboardingRequired && !allowedWhenLocked.has(to.path))
    return navigateTo('/onboarding')

  if (!onboardingRequired && to.path === '/onboarding')
    return navigateTo('/signatures/new')

  // Nested settings routes use `pages/settings.vue` + `pages/settings/*.vue` (Nuxt nested routes).
  // There is no index child under `/settings`, so normalize bare paths to the default tab.
  if (to.path === '/settings' || to.path === '/settings/')
    return navigateTo('/settings/profile')

  if (to.path === '/profile')
    return navigateTo('/settings/profile')
})
