<script setup lang="ts">
const route = useRoute()
const onboardingRequired = useState<boolean>('onboarding-required', () => false)
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
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <NuxtLink to="/" class="text-lg font-semibold text-slate-900">
          GlitchMao
        </NuxtLink>
        <div class="flex items-center gap-2">
          <template v-if="authState.authenticated">
            <span class="text-sm text-slate-600">{{ authState.user?.displayName }}</span>
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
            <UiButton type="button" variant="secondary" class="text-xs" @click="logout">
              Logout
            </UiButton>
          </template>
        </div>
        <nav v-if="(!onboardingRequired || route.path === '/onboarding') && authState.authenticated" class="flex flex-wrap items-center gap-2">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-md px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
            :class="route.path === item.to ? 'bg-slate-200 text-slate-900' : 'text-slate-700'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <slot />
  </div>
</template>
