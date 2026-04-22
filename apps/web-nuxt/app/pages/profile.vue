<script setup lang="ts">
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
      success.value = 'Profil cree.'
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
      success.value = 'Profil mis a jour.'
    }
    await loadProfile()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Profile request failed'
  }
}

onMounted(loadProfile)
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-8">
    <h1 class="text-2xl font-semibold">
      Profil
    </h1>
    <p class="mt-2 text-sm text-slate-600">
      {{ profile ? 'Editez votre profil principal.' : 'Creez votre profil principal pour commencer.' }}
    </p>

    <UiCard as="form" class="mt-6" @submit.prevent="saveProfile">
      <UiCardContent>
        <div class="grid gap-4">
          <UiFormField>
            <UiLabel for="display-name">
              Nom affiche
            </UiLabel>
            <UiInput id="display-name" v-model="displayName" type="text" name="display-name" required />
          </UiFormField>

          <UiFormField>
            <UiLabel for="handle">
              Handle
            </UiLabel>
            <UiInput id="handle" v-model="handle" type="text" name="handle" :disabled="Boolean(profile)" required />
          </UiFormField>

          <UiFormField>
            <UiLabel for="avatar-url">
              Avatar URL (optionnel)
            </UiLabel>
            <UiInput id="avatar-url" v-model="avatarUrl" type="url" name="avatar-url" />
          </UiFormField>

          <UiFormField>
            <UiLabel for="key-fingerprint">
              Key fingerprint (optionnel)
            </UiLabel>
            <UiInput id="key-fingerprint" v-model="keyFingerprint" type="text" name="key-fingerprint" />
          </UiFormField>

          <UiFormField>
            <UiLabel for="bio">
              Bio (optionnel)
            </UiLabel>
            <UiTextarea id="bio" v-model="bio" :rows="5" />
          </UiFormField>

          <UiButton type="submit">
            {{ profile ? 'Mettre a jour le profil' : 'Creer le profil' }}
          </UiButton>
        </div>
      </UiCardContent>
    </UiCard>

    <p v-if="success" class="mt-4 text-sm font-medium text-emerald-700">
      {{ success }}
    </p>
    <p v-if="error" class="mt-4 text-sm font-medium text-red-700">
      {{ error }}
    </p>
  </main>
</template>
