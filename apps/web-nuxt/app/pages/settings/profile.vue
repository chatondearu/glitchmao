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
const error = ref('')
const success = ref('')

async function loadProfile() {
  const response = await $fetch<ProfileResponse>('/api/profile')
  profile.value = response.profile
  if (response.profile) {
    handle.value = response.profile.handle
    displayName.value = response.profile.displayName
    bio.value = response.profile.bio ?? ''
    avatarUrl.value = response.profile.avatarUrl ?? ''
    keyFingerprint.value = response.profile.keyFingerprint ?? ''
  }
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
</script>

<template>
  <section class="mt-6">
    <h2 class="text-body-lg font-semibold">
      {{ t('title') }}
    </h2>
    <p class="mt-2 text-body-md text-on-surface-variant">
      {{ profile ? t('subtitleEdit') : t('subtitleCreate') }}
    </p>

    <UiCard as="form" class="mt-6" @submit.prevent="saveProfile">
      <UiCardContent>
        <div class="grid gap-4">
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
            <UiLabel for="avatar-url">
              {{ t('avatarUrl') }}
            </UiLabel>
            <UiInput id="avatar-url" v-model="avatarUrl" type="url" name="avatar-url" />
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
      </UiCardContent>
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
    "displayName": "Nom affiche",
    "handle": "Identifiant",
    "avatarUrl": "Avatar URL (optionnel)",
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
    "displayName": "Display name",
    "handle": "Handle",
    "avatarUrl": "Avatar URL (optional)",
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
