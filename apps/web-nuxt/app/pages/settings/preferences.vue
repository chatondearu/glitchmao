<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
interface GpgKeyItem {
  id: string
  fingerprint: string
  keyId: string | null
  algorithm: string | null
  status: 'active' | 'compromised'
  isDefault: boolean
  createdAt: string
}

const keys = ref<GpgKeyItem[]>([])
const error = ref('')
const authError = ref('')
const authSuccess = ref('')
const hasPassword = ref(true)
const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const compromiseNote = ref<Record<string, string>>({})
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

async function loadAuthState() {
  authError.value = ''
  try {
    const response = await $fetch<{ hasPassword: boolean, email: string | null }>('/api/auth/me')
    hasPassword.value = response.hasPassword
    email.value = response.email ?? ''
  }
  catch (err) {
    authError.value = err instanceof Error ? err.message : t('errors.loadAuthState')
  }
}

async function configurePassword() {
  authError.value = ''
  authSuccess.value = ''
  if (newPassword.value !== confirmPassword.value) {
    authError.value = t('errors.passwordMismatch')
    return
  }
  if (newPassword.value.length < PASSWORD_MIN_LENGTH || newPassword.value.length > PASSWORD_MAX_LENGTH) {
    authError.value = t('passwordRule', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    return
  }
  try {
    await $fetch('/api/auth/set-password', {
      method: 'POST',
      body: {
        email: email.value,
        password: newPassword.value,
      },
    })
    authSuccess.value = t('messages.passwordConfigured')
    hasPassword.value = true
    newPassword.value = ''
    confirmPassword.value = ''
  }
  catch (err) {
    authError.value = err instanceof Error ? err.message : t('errors.passwordSetupFailed')
  }
}

async function loadKeys() {
  error.value = ''
  try {
    const response = await $fetch<{ items: GpgKeyItem[] }>('/api/settings/gpg-keys')
    keys.value = response.items
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.loadKeysFailed')
  }
}

async function makeDefault(keyId: string) {
  await $fetch('/api/settings/gpg-keys/default', { method: 'POST', body: { key_id: keyId } })
  await loadKeys()
}

async function markCompromised(keyId: string) {
  await $fetch(`/api/settings/gpg-keys/${keyId}/compromise`, {
    method: 'POST',
    body: {
      reason: 'user_report',
      note: compromiseNote.value[keyId] || undefined,
    },
  })
  await loadKeys()
}

onMounted(async () => {
  await loadAuthState()
  await loadKeys()
})
</script>

<template>
  <section class="mt-6">
    <h2 class="text-body-lg font-semibold">
      {{ t('title') }}
    </h2>
    <p class="mt-2 text-body-md text-on-surface-variant">
      {{ t('subtitle') }}
    </p>

    <UiCard v-if="!hasPassword" variant="primary" class="mt-5">
      <template #header-left>
        <div class="flex flex-col gap-1">
          <h3 class="m-0 text-body-lg font-semibold">
            {{ t('legacyTitle') }}
          </h3>
          <p class="m-0 text-body-md text-on-primary/85">
            {{ t('legacySubtitle') }}
          </p>
        </div>
      </template>
      <div class="grid gap-3">
          <UiInput v-model="email" type="email" name="legacy-email" placeholder="email" />
          <UiInput v-model="newPassword" type="password" name="legacy-password" :placeholder="t('newPasswordPlaceholder')" />
          <UiInput v-model="confirmPassword" type="password" name="legacy-password-confirm" :placeholder="t('confirmPasswordPlaceholder')" />
          <p class="ui-meta-mono">
            {{ t('passwordRuleLabel', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }) }}
          </p>
          <UiButton type="button" @click="configurePassword">
            {{ t('setPasswordAction') }}
          </UiButton>
        </div>
        <p v-if="authSuccess" class="ui-meta-mono mt-2 text-primary">
          {{ authSuccess }}
        </p>
      <p v-if="authError" class="ui-meta-mono mt-2 text-error">
        {{ authError }}
      </p>
    </UiCard>

    <p v-if="error" class="ui-meta-mono mt-4 text-error">
      {{ error }}
    </p>

    <div class="mt-5 grid gap-4">
      <UiCard
        v-for="key in keys"
        :key="key.id"
        as="article"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-medium">
                {{ key.fingerprint }}
              </p>
              <p class="ui-meta-mono">
                Key ID: {{ key.keyId || 'N/A' }} - Algo: {{ key.algorithm || 'N/A' }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 text-label-caps" :class="key.status === 'active' ? 'bg-primary-container text-on-primary' : 'bg-error-container text-on-error-container'">
                {{ key.status }}
              </span>
              <span v-if="key.isDefault" class="bg-surface-bright px-2 py-1 text-label-caps text-on-surface">
                default
              </span>
            </div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <UiInput
              v-model="compromiseNote[key.id]"
              type="text"
              :name="`note-${key.id}`"
              :placeholder="t('compromiseNotePlaceholder')"
            />
            <UiButton
              type="button"
              variant="secondary"
              :disabled="key.status !== 'active' || key.isDefault"
              @click="makeDefault(key.id)"
            >
              {{ t('setDefaultAction') }}
            </UiButton>
            <UiButton
              type="button"
              variant="ghost"
              :disabled="key.status === 'compromised'"
              @click="markCompromised(key.id)"
            >
              {{ t('reportCompromisedAction') }}
            </UiButton>
          </div>
      </UiCard>
    </div>
  </section>
</template>

<i18n lang="json">
{
  "fr": {
    "title": "Parametres - Cles GPG",
    "subtitle": "Vous pouvez definir la cle active par defaut et signaler une cle compromise.",
    "legacyTitle": "Compte legacy - definir un mot de passe",
    "legacySubtitle": "Ce compte n a pas encore de mot de passe. Configurez-le pour activer la connexion classique.",
    "newPasswordPlaceholder": "nouveau mot de passe",
    "confirmPasswordPlaceholder": "confirmer le mot de passe",
    "passwordRule": "Le mot de passe doit contenir entre {min} et {max} caracteres.",
    "passwordRuleLabel": "Regle mot de passe: {min} a {max} caracteres.",
    "setPasswordAction": "Configurer le mot de passe",
    "compromiseNotePlaceholder": "Note de compromission (optionnel)",
    "setDefaultAction": "Definir par defaut",
    "reportCompromisedAction": "Signaler compromise",
    "messages": {
      "passwordConfigured": "Mot de passe configure."
    },
    "errors": {
      "loadAuthState": "Impossible de charger l etat auth.",
      "passwordMismatch": "Les mots de passe ne correspondent pas.",
      "passwordSetupFailed": "Echec de configuration du mot de passe.",
      "loadKeysFailed": "Impossible de charger les cles."
    }
  },
  "en": {
    "title": "Settings - GPG keys",
    "subtitle": "Set the active default key and report compromised keys.",
    "legacyTitle": "Legacy account - set a password",
    "legacySubtitle": "This account has no password yet. Configure one to enable standard login.",
    "newPasswordPlaceholder": "new password",
    "confirmPasswordPlaceholder": "confirm password",
    "passwordRule": "Password must contain between {min} and {max} characters.",
    "passwordRuleLabel": "Password rule: {min} to {max} characters.",
    "setPasswordAction": "Set password",
    "compromiseNotePlaceholder": "Compromise note (optional)",
    "setDefaultAction": "Set as default",
    "reportCompromisedAction": "Report compromised",
    "messages": {
      "passwordConfigured": "Password configured."
    },
    "errors": {
      "loadAuthState": "Failed to load auth state",
      "passwordMismatch": "Passwords do not match.",
      "passwordSetupFailed": "Password setup failed",
      "loadKeysFailed": "Failed to load keys"
    }
  }
}
</i18n>
