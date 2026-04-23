<script setup lang="ts">
const { t, tm, rt } = useI18n({ useScope: 'local' })
const step = ref(0)
const loading = ref(false)
const error = ref('')
const avatarLoadError = ref(false)
const avatarAuto = ref(true)
const avatarSet = ref<'set4' | 'set2' | 'set3'>('set4')
const avatarSeedFallback = ref('new-user')

const slides = computed(() => {
  const rawSlides = tm('slides') as Array<{ title: Parameters<typeof rt>[0], text: Parameters<typeof rt>[0] }>
  return rawSlides.map(slide => ({
    title: rt(slide.title),
    text: rt(slide.text),
  }))
})

const handle = ref('')
const displayName = ref('')
const bio = ref('')
const avatarUrl = ref('')

const profileStepIndex = computed(() => slides.value.length)
const confirmStepIndex = computed(() => slides.value.length + 1)
const isIntroStep = computed(() => step.value < slides.value.length)
const isProfileStep = computed(() => step.value === profileStepIndex.value)
const isConfirmStep = computed(() => step.value === confirmStepIndex.value)

const progressStep = computed(() => {
  if (isIntroStep.value)
    return 1
  if (isProfileStep.value)
    return 2
  return 3
})

const generatedAvatarUrl = computed(() => {
  const seed = (handle.value || displayName.value || avatarSeedFallback.value).trim().replace(/\s+/g, '-').toLowerCase()
  const safeSeed = seed || avatarSeedFallback.value
  return `https://robohash.org/${encodeURIComponent(safeSeed)}.png?size=320x320&set=${avatarSet.value}&bgset=bg1`
})

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

function setAvatarStyle(nextSet: 'set4' | 'set2' | 'set3') {
  avatarSet.value = nextSet
  avatarAuto.value = true
  avatarLoadError.value = false
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

watch(generatedAvatarUrl, (value) => {
  if (!avatarAuto.value)
    return
  avatarUrl.value = value
}, { immediate: true })
</script>

<template>
  <main class="ui-container max-w-5xl py-8 md:py-10">
    <section class="mx-auto mb-8 flex w-full max-w-3xl items-center justify-between gap-2">
      <div class="h-px flex-1 bg-outline-variant" />
      <div class="grid grid-cols-3 gap-3 px-1 md:gap-6">
        <div
          v-for="(label, index) in [t('steps.intro'), t('steps.profile'), t('steps.finish')]"
          :key="label"
          class="flex flex-col items-center gap-2 bg-background px-2 text-center"
        >
          <div
            class="flex h-7 w-7 items-center justify-center border text-label-caps"
            :class="progressStep > index
              ? 'border-primary-container bg-primary-container text-on-primary'
              : 'border-outline-variant bg-surface-container-high text-on-surface-variant'"
          >
            {{ `0${index + 1}` }}
          </div>
          <span
            class="ui-meta-mono text-[10px] uppercase tracking-wider"
            :class="progressStep > index ? 'text-primary-container' : 'text-on-surface-variant'"
          >
            {{ label }}
          </span>
        </div>
      </div>
      <div class="h-px flex-1 bg-outline-variant" />
    </section>

    <div class="grid grid-cols-1 gap-gutter md:grid-cols-12">
      <section class="md:col-span-5">
        <UiCard variant="primary" :header-left="t('avatarPanelTitle')" :header-right="t('avatarPanelTag')">
          <div class="mx-auto mb-4 w-full max-w-56">
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
        </UiCard>
      </section>

      <section class="flex flex-col gap-gutter md:col-span-7">
        <UiCard variant="primary" :header-left="t('dataPanelTitle')" :header-right="t('dataPanelTag')">
          <template v-if="isIntroStep">
              <h1 class="text-headline-md font-semibold">
                {{ slides[step]?.title }}
              </h1>
              <p class="mt-2 text-body-md text-on-surface-variant">
                {{ slides[step]?.text }}
              </p>
              <div class="mt-6 flex items-center justify-between">
                <UiButton type="button" variant="secondary" :disabled="step === 0 || loading" @click="previousStep">
                  {{ t('previous') }}
                </UiButton>
                <UiButton type="button" @click="nextStep">
                  {{ t('next') }}
                  <template #trailing>
                    →
                  </template>
                </UiButton>
              </div>
          </template>

          <template v-else-if="isProfileStep">
              <h1 class="text-headline-md font-semibold">
                {{ t('profileStepTitle') }}
              </h1>
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
                <div class="mt-2 flex items-center justify-between">
                  <UiButton type="button" variant="secondary" :disabled="loading" @click="previousStep">
                    {{ t('previous') }}
                  </UiButton>
                  <UiButton type="submit">
                    {{ t('continue') }}
                    <template #trailing>
                      →
                    </template>
                  </UiButton>
                </div>
              </form>
          </template>

          <template v-else-if="isConfirmStep">
              <h1 class="text-headline-md font-semibold">
                {{ t('confirmTitle') }}
              </h1>
              <p class="mt-2 text-body-md text-on-surface-variant">
                {{ t('confirmText') }}
              </p>
              <div class="mt-6 flex items-center justify-between">
                <UiButton type="button" variant="secondary" :disabled="loading" @click="previousStep">
                  {{ t('previous') }}
                </UiButton>
                <UiButton :disabled="loading" @click="completeOnboarding">
                  {{ loading ? t('creating') : t('finishAction') }}
                  <template #trailing>
                    →
                  </template>
                </UiButton>
              </div>
          </template>

          <p v-if="error" class="ui-meta-mono mt-4 text-error">
            {{ error }}
          </p>
        </UiCard>

        <UiCard variant="secondary">
          <div class="border border-outline-variant bg-surface-container-lowest p-3">
              <p class="ui-meta-mono text-[11px] text-on-surface-variant">
                {{ t('shell.line1') }}
              </p>
              <p class="ui-meta-mono mt-1 text-[11px] text-on-surface-variant">
                {{ t('shell.line2') }}
              </p>
              <p class="ui-meta-mono mt-1 text-[11px] text-primary-container">
                {{ t('shell.line3') }}
              </p>
              <p class="ui-meta-mono mt-1 text-[11px] text-on-surface-variant">
                {{ t('shell.line4') }}
              </p>
          </div>
        </UiCard>
      </section>
    </div>
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
    "steps": {
      "intro": "Demarrage",
      "profile": "Profil",
      "finish": "Validation"
    },
    "avatarPanelTitle": "Avatar",
    "avatarPanelTag": "ROBOHASH",
    "avatarPreviewAlt": "Apercu avatar",
    "avatarFallback": "Avatar indisponible",
    "avatarAutoAction": "Regenerer",
    "avatarModes": {
      "classic": "Style classique",
      "bot": "Style robot",
      "pattern": "Style motif"
    },
    "dataPanelTitle": "Informations",
    "dataPanelTag": "ONBOARDING",
    "shell": {
      "line1": "> Verification du profil en cours...",
      "line2": "> Generation de la cle preparee.",
      "line3": "> Avatar charge et modifiable.",
      "line4": "> Pret pour finalisation."
    },
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
    "steps": {
      "intro": "Start",
      "profile": "Profile",
      "finish": "Confirm"
    },
    "avatarPanelTitle": "Avatar",
    "avatarPanelTag": "ROBOHASH",
    "avatarPreviewAlt": "Avatar preview",
    "avatarFallback": "Avatar unavailable",
    "avatarAutoAction": "Regenerate",
    "avatarModes": {
      "classic": "Classic style",
      "bot": "Bot style",
      "pattern": "Pattern style"
    },
    "dataPanelTitle": "Profile data",
    "dataPanelTag": "ONBOARDING",
    "shell": {
      "line1": "> Verifying profile details...",
      "line2": "> Key generation is prepared.",
      "line3": "> Avatar loaded and editable.",
      "line4": "> Ready for final confirmation."
    },
    "errors": { "failed": "Onboarding failed." }
  }
}
</i18n>
