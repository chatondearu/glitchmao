<script setup lang="ts">
const route = useRoute()
const token = computed(() => String(route.query.token ?? ''))
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

async function resetPassword() {
  error.value = ''
  success.value = ''
  if (!token.value) {
    error.value = 'Token manquant.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.'
    return
  }
  if (password.value.length < PASSWORD_MIN_LENGTH || password.value.length > PASSWORD_MAX_LENGTH) {
    error.value = `Le mot de passe doit contenir entre ${PASSWORD_MIN_LENGTH} et ${PASSWORD_MAX_LENGTH} caracteres.`
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
    success.value = 'Mot de passe reinitialise. Tu peux maintenant te connecter.'
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Password reset failed'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-md px-4 py-10">
    <UiCard as="form" class="mt-6" @submit.prevent="resetPassword">
      <UiCardContent>
        <UiCardHeader>
          <h1 class="text-2xl font-semibold">
            Reinitialisation du mot de passe
          </h1>
        </UiCardHeader>
        <div class="mt-4 grid gap-4">
          <UiFormField>
            <UiLabel for="new-password">
              Nouveau mot de passe
            </UiLabel>
            <UiInput id="new-password" v-model="password" type="password" name="new-password" required />
            <p class="mt-1 text-xs text-slate-600">
              {{ PASSWORD_MIN_LENGTH }} a {{ PASSWORD_MAX_LENGTH }} caracteres.
            </p>
          </UiFormField>
          <UiFormField>
            <UiLabel for="confirm-password">
              Confirmer le mot de passe
            </UiLabel>
            <UiInput id="confirm-password" v-model="confirmPassword" type="password" name="confirm-password" required />
          </UiFormField>
          <UiButton :disabled="loading" type="submit">
            {{ loading ? 'Chargement...' : 'Reinitialiser' }}
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
