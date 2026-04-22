<script setup lang="ts">
const route = useRoute()
const { locale, setLocale } = useI18n({ useScope: 'global' })
const { t } = useI18n({ useScope: 'local' })
const onboardingRequired = useState<boolean>('onboarding-required', () => false)
const { theme, toggleTheme, hydrateTheme } = useTheme()
const profileOptions = ref<Array<{ profileId: string, handle: string, displayName: string, locale: 'fr' | 'en' }>>([])
const authState = ref<{
  authenticated: boolean
  user?: { displayName: string }
  activeProfileId?: string | null
  activeProfileLocale?: 'fr' | 'en' | null
}>({ authenticated: false })
const language = ref<'fr' | 'en'>(locale.value as 'fr' | 'en')
const navItems = [
  { to: '/', labelKey: 'nav.verify' },
  { to: '/signatures/new', labelKey: 'nav.create' },
  { to: '/signatures', labelKey: 'nav.signatures' },
  { to: '/settings/profile', labelKey: 'nav.settings', activePrefix: '/settings' },
] as const

function isNavItemActive(item: (typeof navItems)[number]) {
  if ('activePrefix' in item)
    return route.path === item.to || route.path.startsWith(`${item.activePrefix}/`)
  return route.path === item.to
}

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

watch(locale, (value) => {
  language.value = value as 'fr' | 'en'
})

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
  <div class="ui-page min-h-screen flex flex-col">
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
            :class="isNavItemActive(item) ? 'border-primary-container bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'"
          >
            <span v-if="index > 0" class="ui-meta-mono text-[10px] opacity-70">&gt;</span>
            {{ t(item.labelKey) }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <main class="flex-1">
      <slot />
    </main>
    <footer class="border-t-2 border-outline-variant bg-surface-container-low">
      <div class="ui-container flex flex-wrap items-center justify-between gap-3 py-4">
        <span class="ui-meta-mono text-xs text-on-surface-variant">
          {{ t('footer.usefulLinks') }}
        </span>
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <UiLink to="https://github.com/chatondearu/glitchmao" external>
            {{ t('footer.github') }}
          </UiLink>
          <UiLink to="https://github.com/chatondearu/glitchmao/tree/main/doc" external>
            {{ t('footer.documentation') }}
          </UiLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<i18n lang="json">
{
  "fr": {
    "footer": {
      "usefulLinks": "Liens utiles",
      "github": "Depot GitHub",
      "documentation": "Documentation"
    },
    "nav": {
      "verify": "Verifier",
      "create": "Creer",
      "signatures": "Signatures",
      "profile": "Profil",
      "settings": "Parametres",
      "logout": "Deconnexion",
      "themeDark": "Mode sombre",
      "themeLight": "Mode clair"
    }
  },
  "en": {
    "footer": {
      "usefulLinks": "Useful links",
      "github": "GitHub repository",
      "documentation": "Documentation"
    },
    "nav": {
      "verify": "Verify",
      "create": "Create",
      "signatures": "Signatures",
      "profile": "Profile",
      "settings": "Settings",
      "logout": "Logout",
      "themeDark": "Dark mode",
      "themeLight": "Light mode"
    }
  }
}
</i18n>
