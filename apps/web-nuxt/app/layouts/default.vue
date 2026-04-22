<script setup lang="ts">
const route = useRoute()
const { t, locale, setLocale } = useI18n()
const onboardingRequired = useState<boolean>('onboarding-required', () => false)
const { theme, toggleTheme, hydrateTheme } = useTheme()
const profileOptions = ref<Array<{ profileId: string, handle: string, displayName: string, locale: 'fr' | 'en' }>>([])
const authState = ref<{
  authenticated: boolean
  user?: { displayName: string }
  activeProfileId?: string | null
  activeProfileLocale?: 'fr' | 'en' | null
}>({ authenticated: false })
const language = ref<'fr' | 'en'>('fr')
const navItems = computed(() => [
  { to: '/', label: t('nav.verify') },
  { to: '/signatures/new', label: t('nav.create') },
  { to: '/signatures', label: t('nav.signatures') },
  { to: '/profile', label: t('nav.profile') },
  { to: '/settings', label: t('nav.settings') },
])

async function refreshAuth() {
  authState.value = await $fetch('/api/auth/me').catch(() => ({ authenticated: false }))
  if (!authState.value.authenticated) {
    profileOptions.value = []
    return
  }

  const response = await $fetch<{ items: Array<{ profileId: string, handle: string, displayName: string, locale: 'fr' | 'en' }> }>('/api/profiles')
  profileOptions.value = response.items
  const nextLocale = (authState.value.activeProfileLocale
    ?? response.items.find(item => item.profileId === authState.value.activeProfileId)?.locale
    ?? language.value) as 'fr' | 'en'
  await applyLocale(nextLocale, false)
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

async function applyLocale(nextLocale: 'fr' | 'en', syncProfile = true) {
  language.value = nextLocale
  await setLocale(nextLocale)
  if (!authState.value.authenticated || !syncProfile)
    return

  await $fetch('/api/profile/locale', {
    method: 'PUT',
    body: { locale: nextLocale },
  }).catch(() => {})
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
          <UiSelect
            :model-value="language"
            class="w-auto min-w-28"
            @update:model-value="(value) => applyLocale(value as 'fr' | 'en')"
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </UiSelect>
          <UiButton type="button" variant="ghost" size="sm" @click="toggleTheme">
            {{ theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark') }}
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
              {{ t('nav.logout') }}
            </UiButton>
          </template>
        </div>
        <nav v-if="(!onboardingRequired || route.path === '/onboarding') && authState.authenticated" class="flex flex-wrap items-center gap-2">
          <NuxtLink
            v-for="(item, index) in navItems"
            :key="item.to"
            :to="item.to"
            class="inline-flex items-center gap-2 border border-outline-variant px-3 py-2 text-label-caps transition"
            :class="route.path === item.to ? 'border-primary-container bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'"
          >
            <span v-if="index > 0" class="ui-meta-mono text-[10px] opacity-70">&gt;</span>
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <slot />
  </div>
</template>
