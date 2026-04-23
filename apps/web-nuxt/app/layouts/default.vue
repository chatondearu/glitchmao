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
// Primary nav: verify -> create -> list signatures
const navItems = [
  { to: '/', labelKey: 'nav.verify' },
  { to: '/signatures/new', labelKey: 'nav.create' },
  { to: '/signatures', labelKey: 'nav.signatures' },
] as const

const navLinkClass = 'flex h-9 items-center whitespace-nowrap rounded-sm px-3 text-label-caps transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60'

function isNavItemActive(item: (typeof navItems)[number]) {
  if (item.to === '/')
    return route.path === item.to

  if (item.to === '/signatures')
    return route.path === '/signatures'

  return route.path.startsWith(item.to)
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

async function onLanguageSelect(value: string, close: () => void) {
  await applyLocale(value as 'fr' | 'en')
  close()
}

function onThemeSelect(close: () => void) {
  toggleTheme()
  close()
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
  <UiShell>
    <template #header>
      <UiTopbar>
        <template #brand>
          <NuxtLink
            to="/"
            class="font-tech text-xs font-bold uppercase tracking-[0.14em] text-primary-container md:text-sm"
          >
            GlitchMao
          </NuxtLink>
        </template>
        <template #status>
          <div class="hidden items-center gap-2 ui-meta-mono text-[11px] text-primary-container md:inline-flex">
            <span class="inline-flex h-2 w-2 rounded-full bg-primary-container" />
            <span>{{ t('topbar.secureLink') }}</span>
          </div>
        </template>
        <template #content>
        <div
          v-if="authState.authenticated"
          class="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 md:w-auto md:flex-1 md:justify-end md:gap-3"
        >
          <nav
            v-if="(!onboardingRequired || route.path === '/onboarding')"
            class="flex w-full min-w-0 flex-wrap items-center justify-start md:w-auto md:justify-end"
            aria-label="Primary"
          >
            <div class="flex w-full flex-wrap items-center gap-0.5 rounded-sm border border-outline-variant bg-surface-container p-1 md:w-auto">
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                :aria-current="isNavItemActive(item) ? 'page' : undefined"
                :class="[
                  navLinkClass,
                  isNavItemActive(item)
                    ? 'bg-primary-container text-on-primary'
                    : 'text-on-surface hover:bg-surface-container-high',
                ]"
              >
                {{ t(item.labelKey) }}
              </NuxtLink>
            </div>
          </nav>
          <UiSelect
            v-if="profileOptions.length > 1"
            :model-value="authState.activeProfileId ?? ''"
            class="h-9 w-auto min-w-[12rem] max-w-[min(100%,20rem)] shrink-0"
            @update:model-value="onProfileSelect"
          >
            <option v-for="item in profileOptions" :key="item.profileId" :value="item.profileId">
              {{ item.displayName }} (@{{ item.handle }})
            </option>
          </UiSelect>
          <UiFloatingDropdown placement="bottom-end">
            <template #trigger="{ open, toggle }">
              <UiButton
                type="button"
                variant="ghost"
                size="sm"
                class="h-9 max-w-[min(100%,14rem)] shrink-0 gap-1 border border-outline-variant bg-surface-container px-3 hover:bg-surface-container-high"
                :aria-expanded="open"
                aria-haspopup="menu"
                :aria-label="t('userMenu.openMenuAria')"
                @click="toggle"
              >
                <span class="truncate">
                  {{ authState.user?.displayName?.trim() || t('userMenu.accountFallback') }}
                </span>
                <span class="ui-meta-mono text-[10px] opacity-70" aria-hidden="true">▾</span>
              </UiButton>
            </template>
            <template #default="{ close }">
              <div class="flex min-w-[min(100vw-2rem,17.5rem)] flex-col gap-1 px-2 py-1">
                <NuxtLink
                  to="/settings/profile"
                  :aria-current="route.path.startsWith('/settings') ? 'page' : undefined"
                  class="flex h-9 items-center rounded-sm px-2 text-left text-label-caps text-on-surface transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
                  :class="route.path.startsWith('/settings') ? 'bg-primary-container text-on-primary hover:bg-primary-container' : undefined"
                  role="menuitem"
                  @click="close"
                >
                  {{ t('nav.settings') }}
                </NuxtLink>
                <div class="flex flex-col gap-1 px-2 pb-1 pt-2">
                  <span class="ui-meta-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                    {{ t('nav.language') }}
                  </span>
                  <UiSelect
                    :model-value="language"
                    class="h-9 w-full min-w-0"
                    @update:model-value="(value) => onLanguageSelect(value, close)"
                  >
                    <option value="fr">FR</option>
                    <option value="en">EN</option>
                  </UiSelect>
                </div>
                <UiButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="h-9 w-full justify-start px-2 font-normal"
                  role="menuitem"
                  @click="onThemeSelect(close)"
                >
                  {{ theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark') }}
                </UiButton>
                <div class="my-2 border-t border-outline-variant" role="presentation" />
                <UiButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="h-9 w-full justify-start px-2 text-error hover:bg-error-container/15"
                  role="menuitem"
                  @click="() => { close(); void logout() }"
                >
                  {{ t('nav.logout') }}
                </UiButton>
              </div>
            </template>
          </UiFloatingDropdown>
        </div>
        </template>
      </UiTopbar>
    </template>
    <slot />
    <template #footer>
      <footer class="border-t border-outline-variant bg-surface-container-lowest/95 backdrop-blur-sm">
      <div class="ui-container flex min-h-12 flex-wrap items-center justify-between gap-3 py-2">
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
    </template>
  </UiShell>
</template>

<i18n lang="json">
{
  "fr": {
    "topbar": {
      "secureLink": "Lien securise"
    },
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
      "language": "Langue",
      "logout": "Deconnexion",
      "themeDark": "Mode sombre",
      "themeLight": "Mode clair"
    },
    "userMenu": {
      "openMenuAria": "Ouvrir le menu compte",
      "accountFallback": "Compte"
    }
  },
  "en": {
    "topbar": {
      "secureLink": "Secure link"
    },
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
      "language": "Language",
      "logout": "Logout",
      "themeDark": "Dark mode",
      "themeLight": "Light mode"
    },
    "userMenu": {
      "openMenuAria": "Open account menu",
      "accountFallback": "Account"
    }
  }
}
</i18n>
