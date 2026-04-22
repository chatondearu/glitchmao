<script setup lang="ts">
const { t, tm } = useI18n({ useScope: 'local' })
const step = ref(0)
const loading = ref(false)
const error = ref('')

const slides = computed(() => tm('slides') as Array<{ title: string, text: string }>)

const handle = ref('')
const displayName = ref('')
const bio = ref('')
const avatarUrl = ref('')

const isProfileStep = computed(() => step.value === slides.value.length)
const isConfirmStep = computed(() => step.value === slides.value.length + 1)

function nextStep() {
  step.value += 1
}

function previousStep() {
  step.value = Math.max(0, step.value - 1)
}

async function completeOnboarding() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/onboarding/complete', {
      method: 'POST',
      body: {
        handle: handle.value,
        display_name: displayName.value,
        bio: bio.value || undefined,
        avatar_url: avatarUrl.value || undefined,
      },
    })
    await navigateTo('/signatures/new')
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.failed')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="ui-container max-w-4xl py-10">
    <UiCard>
      <UiCardContent>
      <template v-if="step < slides.length">
        <UiCardHeader>
          <h1 class="text-headline-md font-semibold">
            {{ slides[step]?.title }}
          </h1>
          <p class="text-body-md text-on-surface-variant">
            {{ slides[step]?.text }}
          </p>
        </UiCardHeader>
      </template>

      <template v-else-if="isProfileStep">
        <UiCardHeader>
          <h1 class="text-headline-md font-semibold">
            {{ t('profileStepTitle') }}
          </h1>
        </UiCardHeader>
        <form class="mt-5 grid gap-4" @submit.prevent="nextStep">
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
            <UiInput id="handle" v-model="handle" type="text" name="handle" required />
          </UiFormField>
          <UiFormField>
            <UiLabel for="bio">
              {{ t('bio') }}
            </UiLabel>
            <UiTextarea id="bio" v-model="bio" :rows="4" />
          </UiFormField>
          <UiFormField>
            <UiLabel for="avatar-url">
              {{ t('avatarUrl') }}
            </UiLabel>
            <UiInput id="avatar-url" v-model="avatarUrl" type="url" name="avatar-url" />
          </UiFormField>
          <UiButton type="submit">
            {{ t('continue') }}
          </UiButton>
        </form>
      </template>

      <template v-else-if="isConfirmStep">
        <UiCardHeader>
          <h1 class="text-headline-md font-semibold">
            {{ t('confirmTitle') }}
          </h1>
          <p class="text-body-md text-on-surface-variant">
            {{ t('confirmText') }}
          </p>
        </UiCardHeader>
        <UiButton class="mt-6" :disabled="loading" @click="completeOnboarding">
          {{ loading ? t('creating') : t('finishAction') }}
        </UiButton>
      </template>

      <p v-if="error" class="ui-meta-mono mt-4 text-error">
        {{ error }}
      </p>

      <div class="mt-8 flex items-center justify-between">
        <UiButton type="button" variant="secondary" :disabled="step === 0 || loading" @click="previousStep">
          {{ t('previous') }}
        </UiButton>
        <UiButton v-if="step < slides.length" type="button" @click="nextStep">
          {{ t('next') }}
        </UiButton>
      </div>
      </UiCardContent>
    </UiCard>
  </main>
</template>

<i18n lang="json">
{
  "fr": {
    "slides": [
      { "title": "Bienvenue sur GlitchMao", "text": "GlitchMao permet de signer des contenus pour prouver leur authenticite." },
      { "title": "Hash et signature", "text": "Le hash garantit l integrite. La signature GPG prouve l auteur du hash." },
      { "title": "Cles GPG", "text": "Une cle par defaut sera creee automatiquement pour limiter les manipulations." }
    ],
    "profileStepTitle": "Creez votre profil principal",
    "displayName": "Nom affiche",
    "handle": "Identifiant",
    "bio": "Bio (optionnel)",
    "avatarUrl": "Avatar URL (optionnel)",
    "continue": "Continuer",
    "confirmTitle": "Finaliser l onboarding",
    "confirmText": "Une cle GPG par defaut va etre creee automatiquement pour votre profil.",
    "creating": "Creation en cours...",
    "finishAction": "Terminer et creer ma cle",
    "previous": "Precedent",
    "next": "Suivant",
    "errors": { "failed": "Echec de l onboarding." }
  },
  "en": {
    "slides": [
      { "title": "Welcome to GlitchMao", "text": "GlitchMao lets you sign content to prove authenticity." },
      { "title": "Hash and signature", "text": "Hash guarantees integrity. A GPG signature proves who authored the hash." },
      { "title": "GPG keys", "text": "A default key is generated automatically to reduce operational friction." }
    ],
    "profileStepTitle": "Create your main profile",
    "displayName": "Display name",
    "handle": "Handle",
    "bio": "Bio (optional)",
    "avatarUrl": "Avatar URL (optional)",
    "continue": "Continue",
    "confirmTitle": "Finalize onboarding",
    "confirmText": "A default GPG key will be generated automatically for your profile.",
    "creating": "Creating...",
    "finishAction": "Finish and create my key",
    "previous": "Previous",
    "next": "Next",
    "errors": { "failed": "Onboarding failed." }
  }
}
</i18n>
