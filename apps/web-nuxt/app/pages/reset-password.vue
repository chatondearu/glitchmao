<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const token = computed(() => String(route.query.token ?? ''))
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const redirecting = ref(false)
const error = ref('')
const success = ref('')
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

async function resetPassword() {
  error.value = ''
  success.value = ''
  if (!token.value) {
    error.value = t('errors.generic')
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = t('auth.passwordMismatch')
    return
  }
  if (password.value.length < PASSWORD_MIN_LENGTH || password.value.length > PASSWORD_MAX_LENGTH) {
    error.value = t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/forgot-password/reset', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value,
      },
    })
    success.value = t('auth.resetSuccess')
    redirecting.value = true
    setTimeout(() => {
      void navigateTo('/login')
    }, 1800)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.resetFailed')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="ui-container max-w-2xl py-10">
    <UiCard as="form" variant="primary" class="mt-6" @submit.prevent="resetPassword">
      <template #header-left>
        {{ t('auth.resetTitle') }}
      </template>
      <div class="grid gap-4">
          <UiFormField>
            <UiLabel for="new-password">
              {{ t('auth.newPassword') }}
            </UiLabel>
            <UiInput id="new-password" v-model="password" type="password" name="new-password" required />
            <p class="ui-meta-mono mt-1">
              {{ t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }) }}
            </p>
          </UiFormField>
          <UiFormField>
            <UiLabel for="confirm-password">
              {{ t('auth.confirmPassword') }}
            </UiLabel>
            <UiInput id="confirm-password" v-model="confirmPassword" type="password" name="confirm-password" required />
          </UiFormField>
          <UiButton :disabled="loading" type="submit">
            {{ loading ? t('common.loading') : t('auth.resetAction') }}
          </UiButton>
      </div>
    </UiCard>
    <p v-if="success" class="ui-meta-mono mt-4 text-primary">
      {{ success }}
    </p>
    <p v-if="success && redirecting" class="ui-meta-mono mt-2 text-on-surface-variant">
      {{ t('auth.redirecting') }}
    </p>
    <UiLink v-if="success" to="/login" class="mt-3 inline-flex">
      {{ t('auth.backToLogin') }}
    </UiLink>
    <p v-if="error" class="ui-meta-mono mt-4 text-error">
      {{ error }}
    </p>
  </main>
</template>

<i18n lang="json">
{
  "fr": {
    "common": {
      "loading": "Chargement..."
    },
    "auth": {
      "passwordMismatch": "Les mots de passe ne correspondent pas.",
      "passwordHint": "Le mot de passe doit contenir entre {min} et {max} caracteres.",
      "resetSuccess": "Mot de passe reinitialise. Vous pouvez maintenant vous connecter.",
      "redirecting": "Redirection vers la page de connexion...",
      "backToLogin": "Retour a la connexion",
      "resetTitle": "Reinitialisation du mot de passe",
      "newPassword": "Nouveau mot de passe",
      "confirmPassword": "Confirmer le mot de passe",
      "resetAction": "Reinitialiser"
    },
    "errors": {
      "generic": "Une erreur est survenue.",
      "resetFailed": "Echec de la reinitialisation du mot de passe."
    }
  },
  "en": {
    "common": {
      "loading": "Loading..."
    },
    "auth": {
      "passwordMismatch": "Passwords do not match.",
      "passwordHint": "Password must contain between {min} and {max} characters.",
      "resetSuccess": "Password has been reset. You can now sign in.",
      "redirecting": "Redirecting to sign in...",
      "backToLogin": "Back to sign in",
      "resetTitle": "Password reset",
      "newPassword": "New password",
      "confirmPassword": "Confirm password",
      "resetAction": "Reset"
    },
    "errors": {
      "generic": "Something went wrong.",
      "resetFailed": "Password reset failed."
    }
  }
}
</i18n>
