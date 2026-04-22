<script setup lang="ts">
const route = useRoute()
const onboardingRequired = useState<boolean>('onboarding-required', () => false)
const { theme, toggleTheme, hydrateTheme } = useTheme()
const profileOptions = ref<Array<{ profileId: string, handle: string, displayName: string }>>([])
const authState = ref<{
  authenticated: boolean
  user?: { displayName: string }
  activeProfileId?: string | null
}>({ authenticated: false })
const navItems = [
  { to: '/', label: 'Verifier' },
  { to: '/signatures/new', label: 'Creer' },
  { to: '/signatures', label: 'Signatures' },
  { to: '/profile', label: 'Profil' },
  { to: '/settings', label: 'Settings' },
]

async function refreshAuth() {
  authState.value = await $fetch('/api/auth/me').catch(() => ({ authenticated: false }))
  if (!authState.value.authenticated) {
    profileOptions.value = []
    return
  }

  const response = await $fetch<{ items: Array<{ profileId: string, handle: string, displayName: string }> }>('/api/profiles')
  profileOptions.value = response.items
}

async function switchProfile(profileId: string) {
  await $fetch('/api/auth/switch-profile', {
    method: 'POST',
    body: { profile_id: profileId },
  })
  authState.value.activeProfileId = profileId
  await refreshNuxtData()
}

function onProfileSelect(value: string) {
  if (!value)
    return

  switchProfile(value)
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

onMounted(async () => {
  hydrateTheme()
  try {
    await refreshAuth()
    const response = await $fetch<{ onboardingRequired: boolean }>('/api/onboarding/state')
    onboardingRequired.value = response.onboardingRequired
  }
  catch {
    onboardingRequired.value = true
  }
})
</script>

<template>
  <div class="ui-page">
    <header class="border-b-2 border-outline-variant bg-surface-container-low">
      <div class="ui-container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <NuxtLink to="/" class="text-headline-md font-semibold text-on-surface">
          GlitchMao
        </NuxtLink>
        <div class="flex items-center gap-2">
          <UiButton type="button" variant="ghost" size="sm" @click="toggleTheme">
            {{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}
          </UiButton>
          <template v-if="authState.authenticated">
            <span class="ui-meta-mono">{{ authState.user?.displayName }}</span>
            <UiSelect
              v-if="profileOptions.length > 1"
              :model-value="authState.activeProfileId ?? ''"
              class="w-auto min-w-52"
              @update:model-value="onProfileSelect"
            >
              <option v-for="item in profileOptions" :key="item.profileId" :value="item.profileId">
                {{ item.displayName }} (@{{ item.handle }})
              </option>
            </UiSelect>
            <UiButton type="button" variant="secondary" size="sm" @click="logout">
              Logout
            </UiButton>
          </template>
        </div>
        <nav v-if="(!onboardingRequired || route.path === '/onboarding') && authState.authenticated" class="flex flex-wrap items-center gap-2">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="border border-outline-variant px-3 py-2 text-label-caps transition"
            :class="route.path === item.to ? 'border-primary-container bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <slot />
  </div>
</template>
