<script setup lang="ts">
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
    error.value = `Le mot de passe doit contenir entre ${PASSWORD_MIN_LENGTH} et ${PASSWORD_MAX_LENGTH} caracteres.`
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
    error.value = err instanceof Error ? err.message : 'Authentication failed'
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
    forgotSuccess.value = 'Si le compte existe, un e-mail de reinitialisation a ete envoye.'
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Password reset request failed'
  }
}
</script>

<template>
  <main class="ui-container max-w-2xl py-10">
    <UiCard as="form" class="mt-6" @submit.prevent="submit">
      <UiCardContent>
        <UiCardHeader>
          <h1 class="text-headline-md font-semibold">
            {{ mode === 'login' ? 'Connexion' : 'Creer un compte' }}
          </h1>
          <p class="text-body-md text-on-surface-variant">
            Authentifiez-vous pour acceder aux signatures et aux profils.
          </p>
        </UiCardHeader>

        <div class="mt-4 grid gap-4">
          <UiFormField>
            <UiLabel for="handle">
              Handle
            </UiLabel>
            <UiInput id="handle" v-model="handle" type="text" name="handle" required />
          </UiFormField>

          <UiFormField v-if="mode === 'register'">
            <UiLabel for="email">
              Email
            </UiLabel>
            <UiInput id="email" v-model="email" type="email" name="email" required />
          </UiFormField>

          <UiFormField v-if="mode === 'register'">
            <UiLabel for="display-name">
              Nom affiche
            </UiLabel>
            <UiInput id="display-name" v-model="displayName" type="text" name="display-name" required />
          </UiFormField>

          <UiFormField>
            <UiLabel for="password">
              Mot de passe
            </UiLabel>
            <UiInput id="password" v-model="password" type="password" name="password" required />
            <p class="ui-meta-mono mt-1">
              {{ PASSWORD_MIN_LENGTH }} a {{ PASSWORD_MAX_LENGTH }} caracteres.
            </p>
          </UiFormField>

          <UiButton :disabled="loading" type="submit">
            {{ loading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : 'Creer le compte') }}
          </UiButton>
        </div>
      </UiCardContent>
    </UiCard>

    <UiButton
      type="button"
      variant="ghost"
      size="sm"
      class="mt-4 underline underline-offset-2"
      @click="mode = mode === 'login' ? 'register' : 'login'"
    >
      {{ mode === 'login' ? 'Pas de compte ? Inscription' : 'Deja un compte ? Connexion' }}
    </UiButton>

    <p v-if="error" class="ui-meta-mono mt-4 text-error">
      {{ error }}
    </p>

    <UiCard v-if="mode === 'login'" class="mt-8">
      <UiCardContent>
        <UiCardHeader>
          <p class="text-body-md font-semibold text-on-surface">
            Mot de passe oublie
          </p>
          <p class="ui-meta-mono">
            Saisis ton handle ou ton e-mail pour recevoir un lien de reinitialisation.
          </p>
        </UiCardHeader>
        <div class="mt-3 flex gap-2">
          <UiInput v-model="forgotIdentifier" type="text" name="forgot-identifier" placeholder="handle ou email" />
          <UiButton type="button" variant="secondary" @click="requestPasswordReset">
            Envoyer
          </UiButton>
        </div>
        <p v-if="forgotSuccess" class="ui-meta-mono mt-2 text-primary">
          {{ forgotSuccess }}
        </p>
      </UiCardContent>
    </UiCard>
  </main>
</template>
