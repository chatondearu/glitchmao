<script setup lang="ts">
const step = ref(0)
const loading = ref(false)
const error = ref('')

const slides = [
  {
    title: 'Bienvenue sur GlitchMao',
    text: 'GlitchMao permet de signer des contenus pour prouver leur authenticite.',
  },
  {
    title: 'Hash et signature',
    text: 'Le hash garantit l integrite. La signature GPG prouve l auteur du hash.',
  },
  {
    title: 'Cles GPG',
    text: 'Une cle par defaut sera creee automatiquement pour limiter les manipulations.',
  },
]

const handle = ref('')
const displayName = ref('')
const bio = ref('')
const avatarUrl = ref('')

const isProfileStep = computed(() => step.value === slides.length)
const isConfirmStep = computed(() => step.value === slides.length + 1)

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
    error.value = err instanceof Error ? err.message : 'Onboarding failed'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-10">
    <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <template v-if="step < slides.length">
        <h1 class="text-2xl font-semibold">
          {{ slides[step]?.title }}
        </h1>
        <p class="mt-3 text-slate-700">
          {{ slides[step]?.text }}
        </p>
      </template>

      <template v-else-if="isProfileStep">
        <h1 class="text-2xl font-semibold">
          Creez votre profil principal
        </h1>
        <form class="mt-5 grid gap-4" @submit.prevent="nextStep">
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
            <UiInput id="handle" v-model="handle" type="text" name="handle" required />
          </UiFormField>
          <UiFormField>
            <UiLabel for="bio">
              Bio (optionnel)
            </UiLabel>
            <textarea id="bio" v-model="bio" class="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </UiFormField>
          <UiFormField>
            <UiLabel for="avatar-url">
              Avatar URL (optionnel)
            </UiLabel>
            <UiInput id="avatar-url" v-model="avatarUrl" type="url" name="avatar-url" />
          </UiFormField>
          <UiButton type="submit">
            Continuer
          </UiButton>
        </form>
      </template>

      <template v-else-if="isConfirmStep">
        <h1 class="text-2xl font-semibold">
          Finaliser l onboarding
        </h1>
        <p class="mt-3 text-slate-700">
          Une cle GPG par defaut va etre creee automatiquement pour votre profil.
        </p>
        <UiButton class="mt-6" :disabled="loading" @click="completeOnboarding">
          {{ loading ? 'Creation en cours...' : 'Terminer et creer ma cle' }}
        </UiButton>
      </template>

      <p v-if="error" class="mt-4 text-sm font-medium text-red-700">
        {{ error }}
      </p>

      <div class="mt-8 flex items-center justify-between">
        <UiButton type="button" variant="secondary" :disabled="step === 0 || loading" @click="previousStep">
          Precedent
        </UiButton>
        <UiButton v-if="step < slides.length" type="button" @click="nextStep">
          Suivant
        </UiButton>
      </div>
    </div>
  </main>
</template>
