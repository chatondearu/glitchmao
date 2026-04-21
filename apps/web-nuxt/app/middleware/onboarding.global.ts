export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/api'))
    return

  const allowedWhenLocked = new Set(['/onboarding'])
  const { onboardingRequired } = await $fetch<{ onboardingRequired: boolean }>('/api/onboarding/state')
  const onboardingState = useState<boolean>('onboarding-required')
  onboardingState.value = onboardingRequired

  if (onboardingRequired && !allowedWhenLocked.has(to.path))
    return navigateTo('/onboarding')

  if (!onboardingRequired && to.path === '/onboarding')
    return navigateTo('/signatures/new')
})
