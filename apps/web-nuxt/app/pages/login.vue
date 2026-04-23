<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const mode = ref<'login' | 'register'>('login')
const handle = ref('')
const email = ref('')
const displayName = ref('')
const password = ref('')
const forgotIdentifier = ref('')
const loading = ref(false)
const error = ref('')
const forgotSuccess = ref('')
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

async function submit() {
  loading.value = true
  error.value = ''
  if (password.value.length < PASSWORD_MIN_LENGTH || password.value.length > PASSWORD_MAX_LENGTH) {
    error.value = t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    loading.value = false
    return
  }
  try {
    if (mode.value === 'register') {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: {
          handle: handle.value,
          email: email.value,
          display_name: displayName.value,
          password: password.value,
        },
      })
    }
    else {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          handle: handle.value,
          password: password.value,
        },
      })
    }

    await navigateTo('/signatures/new')
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.authFailed')
  }
  finally {
    loading.value = false
  }
}

async function requestPasswordReset() {
  error.value = ''
  forgotSuccess.value = ''
  try {
    await $fetch('/api/auth/forgot-password/request', {
      method: 'POST',
      body: { identifier: forgotIdentifier.value },
    })
    forgotSuccess.value = t('auth.forgotSuccess')
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.resetRequestFailed')
  }
}
</script>

<template>
  <main class="ui-container max-w-2xl py-10">
    <UiCard as="form" variant="primary" class="mt-6" @submit.prevent="submit">
      <template #header-left>
        <div class="flex flex-col gap-1">
          <h1 class="m-0 text-headline-md font-semibold">
            {{ mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle') }}
          </h1>
          <p class="m-0 text-body-md text-on-primary/85">
            {{ t('auth.subtitle') }}
          </p>
        </div>
      </template>
      <div class="grid gap-4">
          <UiFormField>
            <UiLabel for="handle">
              {{ t('auth.handle') }}
            </UiLabel>
            <UiInput id="handle" v-model="handle" type="text" name="handle" required />
          </UiFormField>

          <UiFormField v-if="mode === 'register'">
            <UiLabel for="email">
              {{ t('auth.email') }}
            </UiLabel>
            <UiInput id="email" v-model="email" type="email" name="email" required />
          </UiFormField>

          <UiFormField v-if="mode === 'register'">
            <UiLabel for="display-name">
              {{ t('auth.displayName') }}
            </UiLabel>
            <UiInput id="display-name" v-model="displayName" type="text" name="display-name" required />
          </UiFormField>

          <UiFormField>
            <UiLabel for="password">
              {{ t('auth.password') }}
            </UiLabel>
            <UiInput id="password" v-model="password" type="password" name="password" required />
            <p class="ui-meta-mono mt-1">
              {{ t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }) }}
            </p>
          </UiFormField>

          <UiButton :disabled="loading" type="submit">
            {{ loading ? t('common.loading') : (mode === 'login' ? t('auth.login') : t('auth.register')) }}
          </UiButton>
      </div>
    </UiCard>

    <UiButton
      type="button"
      variant="ghost"
      size="sm"
      class="mt-4 underline underline-offset-2"
      @click="mode = mode === 'login' ? 'register' : 'login'"
    >
      {{ mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount') }}
    </UiButton>

    <p v-if="error" class="ui-meta-mono mt-4 text-error">
      {{ error }}
    </p>

    <UiCard v-if="mode === 'login'" variant="secondary" class="mt-8">
      <template #header-left>
        <div class="flex flex-col gap-1">
          <p class="m-0 text-body-md font-semibold">
            {{ t('auth.forgotTitle') }}
          </p>
          <p class="m-0 ui-meta-mono text-on-secondary-container/85">
            {{ t('auth.forgotHint') }}
          </p>
        </div>
      </template>
      <div class="flex flex-col gap-2 sm:flex-row">
          <UiInput v-model="forgotIdentifier" type="text" name="forgot-identifier" :placeholder="t('auth.forgotPlaceholder')" />
          <UiButton type="button" variant="secondary" @click="requestPasswordReset">
            {{ t('common.send') }}
          </UiButton>
        </div>
      <p v-if="forgotSuccess" class="ui-meta-mono mt-2 text-primary">
        {{ forgotSuccess }}
      </p>
    </UiCard>
  </main>
</template>

<i18n lang="json">
{
  "fr": {
    "common": {
      "loading": "Chargement...",
      "send": "Envoyer"
    },
    "auth": {
      "loginTitle": "Connexion",
      "registerTitle": "Creer un compte",
      "subtitle": "Authentifiez-vous pour acceder aux signatures et aux profils.",
      "handle": "Identifiant",
      "email": "Email",
      "displayName": "Nom affiche",
      "password": "Mot de passe",
      "passwordHint": "Le mot de passe doit contenir entre {min} et {max} caracteres.",
      "login": "Se connecter",
      "register": "Creer le compte",
      "noAccount": "Pas de compte ? Inscription",
      "haveAccount": "Deja un compte ? Connexion",
      "forgotTitle": "Mot de passe oublie",
      "forgotHint": "Saisissez votre identifiant ou e-mail pour recevoir un lien de reinitialisation.",
      "forgotPlaceholder": "identifiant ou email",
      "forgotSuccess": "Si le compte existe, un e-mail de reinitialisation a ete envoye."
    },
    "errors": {
      "authFailed": "Echec de l authentification.",
      "resetRequestFailed": "Echec de la demande de reinitialisation."
    }
  },
  "en": {
    "common": {
      "loading": "Loading...",
      "send": "Send"
    },
    "auth": {
      "loginTitle": "Sign in",
      "registerTitle": "Create account",
      "subtitle": "Sign in to access signatures and profiles.",
      "handle": "Handle",
      "email": "Email",
      "displayName": "Display name",
      "password": "Password",
      "passwordHint": "Password must contain between {min} and {max} characters.",
      "login": "Sign in",
      "register": "Create account",
      "noAccount": "No account? Register",
      "haveAccount": "Already have an account? Sign in",
      "forgotTitle": "Forgot password",
      "forgotHint": "Enter your handle or email to receive a reset link.",
      "forgotPlaceholder": "handle or email",
      "forgotSuccess": "If the account exists, a reset email has been sent."
    },
    "errors": {
      "authFailed": "Authentication failed.",
      "resetRequestFailed": "Password reset request failed."
    }
  }
}
</i18n>
