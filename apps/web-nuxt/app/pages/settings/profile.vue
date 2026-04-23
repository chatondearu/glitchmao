<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
interface ProfileResponse {
  profile: {
    userId: string
    profileId: string
    handle: string
    displayName: string
    bio: string | null
    avatarUrl: string | null
    keyFingerprint: string | null
  } | null
}

const profile = ref<ProfileResponse['profile']>(null)
const handle = ref('')
const displayName = ref('')
const bio = ref('')
const avatarUrl = ref('')
const keyFingerprint = ref('')
const avatarLoadError = ref(false)
const avatarAuto = ref(false)
const avatarSet = ref<'set4' | 'set2' | 'set3'>('set4')
const avatarSeedFallback = ref('profile-avatar')
const error = ref('')
const success = ref('')

const generatedAvatarUrl = computed(() => {
  const seed = (handle.value || displayName.value || avatarSeedFallback.value).trim().replace(/\s+/g, '-').toLowerCase()
  const safeSeed = seed || avatarSeedFallback.value
  return `https://robohash.org/${encodeURIComponent(safeSeed)}.png?size=320x320&set=${avatarSet.value}&bgset=bg1`
})

function inferAvatarSet(url: string): 'set4' | 'set2' | 'set3' {
  try {
    const parsed = new URL(url)
    const setParam = parsed.searchParams.get('set')
    if (setParam === 'set2' || setParam === 'set3' || setParam === 'set4')
      return setParam
  }
  catch {
    // no-op
  }
  return 'set4'
}

async function loadProfile() {
  const response = await $fetch<ProfileResponse>('/api/profile')
  profile.value = response.profile
  if (response.profile) {
    handle.value = response.profile.handle
    displayName.value = response.profile.displayName
    bio.value = response.profile.bio ?? ''
    avatarUrl.value = response.profile.avatarUrl ?? ''
    keyFingerprint.value = response.profile.keyFingerprint ?? ''
    if (avatarUrl.value.includes('robohash.org')) {
      avatarSet.value = inferAvatarSet(avatarUrl.value)
      avatarAuto.value = true
    }
    else {
      avatarAuto.value = false
    }
  }
}

function setAvatarStyle(nextSet: 'set4' | 'set2' | 'set3') {
  avatarSet.value = nextSet
  avatarAuto.value = true
  avatarLoadError.value = false
  avatarUrl.value = generatedAvatarUrl.value
}

function onAvatarImageError() {
  avatarLoadError.value = true
}

function onAvatarUrlInput(value: string) {
  avatarAuto.value = false
  avatarLoadError.value = false
  avatarUrl.value = value
}

function restoreGeneratedAvatar() {
  avatarAuto.value = true
  avatarLoadError.value = false
  avatarUrl.value = generatedAvatarUrl.value
}

async function saveProfile() {
  error.value = ''
  success.value = ''
  try {
    if (!profile.value) {
      await $fetch('/api/profile', {
        method: 'POST',
        body: {
          handle: handle.value,
          display_name: displayName.value,
          bio: bio.value || undefined,
          avatar_url: avatarUrl.value || undefined,
          key_fingerprint: keyFingerprint.value || undefined,
        },
      })
      success.value = t('messages.created')
    }
    else {
      await $fetch('/api/profile', {
        method: 'PUT',
        body: {
          display_name: displayName.value,
          bio: bio.value || undefined,
          avatar_url: avatarUrl.value || undefined,
          key_fingerprint: keyFingerprint.value || undefined,
        },
      })
      success.value = t('messages.updated')
    }
    await loadProfile()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : t('messages.failed')
  }
}

onMounted(loadProfile)

watch(generatedAvatarUrl, (value) => {
  if (!avatarAuto.value)
    return
  avatarUrl.value = value
})
</script>

<template>
  <section class="mt-6">
    <h2 class="text-body-lg font-semibold">
      {{ t('title') }}
    </h2>
    <p class="mt-2 text-body-md text-on-surface-variant">
      {{ profile ? t('subtitleEdit') : t('subtitleCreate') }}
    </p>

    <UiCard as="form" variant="primary" class="mt-6" :header-left="t('cardHeaderTitle')" :header-right="t('cardHeaderTag')" @submit.prevent="saveProfile">
      <div class="grid gap-4">
          <div class="mx-auto w-full max-w-56">
            <div class="relative aspect-square overflow-hidden border border-outline-variant bg-surface-container-low">
              <img
                v-if="!avatarLoadError"
                :src="avatarUrl || generatedAvatarUrl"
                :alt="t('avatarPreviewAlt')"
                class="h-full w-full object-cover transition-opacity duration-200"
                @error="onAvatarImageError"
              >
              <div v-else class="flex h-full w-full items-center justify-center text-on-surface-variant">
                <span class="ui-meta-mono text-xs">{{ t('avatarFallback') }}</span>
              </div>
              <div class="absolute left-1 top-1 h-3 w-3 border-l border-t border-primary-container" />
              <div class="absolute right-1 top-1 h-3 w-3 border-r border-t border-primary-container" />
              <div class="absolute bottom-1 left-1 h-3 w-3 border-b border-l border-primary-container" />
              <div class="absolute bottom-1 right-1 h-3 w-3 border-b border-r border-primary-container" />
            </div>
          </div>

          <div class="flex items-center justify-center gap-2">
            <UiIconButton :active="avatarSet === 'set4'" :aria-label="t('avatarModes.classic')" @click="setAvatarStyle('set4')">
              <span class="text-sm">A</span>
            </UiIconButton>
            <UiIconButton :active="avatarSet === 'set2'" :aria-label="t('avatarModes.bot')" @click="setAvatarStyle('set2')">
              <span class="text-sm">B</span>
            </UiIconButton>
            <UiIconButton :active="avatarSet === 'set3'" :aria-label="t('avatarModes.pattern')" @click="setAvatarStyle('set3')">
              <span class="text-sm">C</span>
            </UiIconButton>
          </div>

          <UiFormField>
            <UiLabel for="display-name">
              {{ t('displayName') }}
            </UiLabel>
            <UiInput id="display-name" v-model="displayName" type="text" name="display-name" required />
          </UiFormField>

          <UiFormField>
            <UiLabel for="handle">
              {{ t('handle') }}
            </UiLabel>
            <UiInput id="handle" v-model="handle" type="text" name="handle" :disabled="Boolean(profile)" required />
          </UiFormField>

          <UiFormField>
            <div class="flex items-center justify-between gap-2">
              <UiLabel for="avatar-url">
                {{ t('avatarUrl') }}
              </UiLabel>
              <UiButton type="button" size="sm" variant="ghost" @click="restoreGeneratedAvatar">
                {{ t('avatarAutoAction') }}
              </UiButton>
            </div>
            <UiInput
              id="avatar-url"
              :model-value="avatarUrl"
              type="url"
              name="avatar-url"
              @update:model-value="onAvatarUrlInput(String($event))"
            />
          </UiFormField>

          <UiFormField>
            <UiLabel for="key-fingerprint">
              {{ t('keyFingerprint') }}
            </UiLabel>
            <UiInput id="key-fingerprint" v-model="keyFingerprint" type="text" name="key-fingerprint" />
          </UiFormField>

          <UiFormField>
            <UiLabel for="bio">
              {{ t('bio') }}
            </UiLabel>
            <UiTextarea id="bio" v-model="bio" :rows="5" />
          </UiFormField>

          <UiButton type="submit">
            {{ profile ? t('updateAction') : t('createAction') }}
          </UiButton>
      </div>
    </UiCard>

    <p v-if="success" class="ui-meta-mono mt-4 text-primary">
      {{ success }}
    </p>
    <p v-if="error" class="ui-meta-mono mt-4 text-error">
      {{ error }}
    </p>
  </section>
</template>

<i18n lang="json">
{
  "fr": {
    "title": "Profil",
    "subtitleEdit": "Editez votre profil principal.",
    "subtitleCreate": "Creez votre profil principal pour commencer.",
    "cardHeaderTitle": "Profil",
    "cardHeaderTag": "AVATAR",
    "displayName": "Nom affiche",
    "handle": "Identifiant",
    "avatarUrl": "Avatar URL (optionnel)",
    "avatarAutoAction": "Regenerer",
    "avatarPreviewAlt": "Apercu avatar",
    "avatarFallback": "Avatar indisponible",
    "avatarModes": {
      "classic": "Style classique",
      "bot": "Style robot",
      "pattern": "Style motif"
    },
    "keyFingerprint": "Empreinte de cle (optionnel)",
    "bio": "Bio (optionnel)",
    "updateAction": "Mettre a jour le profil",
    "createAction": "Creer le profil",
    "messages": {
      "created": "Profil cree.",
      "updated": "Profil mis a jour.",
      "failed": "Echec de la mise a jour du profil."
    }
  },
  "en": {
    "title": "Profile",
    "subtitleEdit": "Edit your main profile.",
    "subtitleCreate": "Create your main profile to get started.",
    "cardHeaderTitle": "Profile",
    "cardHeaderTag": "AVATAR",
    "displayName": "Display name",
    "handle": "Handle",
    "avatarUrl": "Avatar URL (optional)",
    "avatarAutoAction": "Regenerate",
    "avatarPreviewAlt": "Avatar preview",
    "avatarFallback": "Avatar unavailable",
    "avatarModes": {
      "classic": "Classic style",
      "bot": "Bot style",
      "pattern": "Pattern style"
    },
    "keyFingerprint": "Key fingerprint (optional)",
    "bio": "Bio (optional)",
    "updateAction": "Update profile",
    "createAction": "Create profile",
    "messages": {
      "created": "Profile created.",
      "updated": "Profile updated.",
      "failed": "Profile request failed."
    }
  }
}
</i18n>
