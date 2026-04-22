<script setup lang="ts">
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
    authError.value = err instanceof Error ? err.message : 'Failed to load auth state'
  }
}

async function configurePassword() {
  authError.value = ''
  authSuccess.value = ''
  if (newPassword.value !== confirmPassword.value) {
    authError.value = 'Les mots de passe ne correspondent pas.'
    return
  }
  if (newPassword.value.length < PASSWORD_MIN_LENGTH || newPassword.value.length > PASSWORD_MAX_LENGTH) {
    authError.value = `Le mot de passe doit contenir entre ${PASSWORD_MIN_LENGTH} et ${PASSWORD_MAX_LENGTH} caracteres.`
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
    authSuccess.value = 'Mot de passe configure.'
    hasPassword.value = true
    newPassword.value = ''
    confirmPassword.value = ''
  }
  catch (err) {
    authError.value = err instanceof Error ? err.message : 'Password setup failed'
  }
}

async function loadKeys() {
  error.value = ''
  try {
    const response = await $fetch<{ items: GpgKeyItem[] }>('/api/settings/gpg-keys')
    keys.value = response.items
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load keys'
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
  <main class="mx-auto max-w-4xl px-4 py-8">
    <h1 class="text-2xl font-semibold">
      Settings - Cles GPG
    </h1>
    <p class="mt-2 text-sm text-slate-600">
      Vous pouvez definir la cle active par defaut et signaler une cle compromise.
    </p>

    <UiCard v-if="!hasPassword" class="mt-5 border-amber-300 bg-amber-50">
      <UiCardContent>
        <UiCardHeader>
          <h2 class="text-base font-semibold text-slate-900">
            Compte legacy - definir un mot de passe
          </h2>
          <p class="text-sm text-slate-700">
            Ce compte n'a pas encore de mot de passe. Configurez-le pour activer la connexion classique.
          </p>
        </UiCardHeader>
        <div class="mt-3 grid gap-3">
          <UiInput v-model="email" type="email" name="legacy-email" placeholder="email" />
          <UiInput v-model="newPassword" type="password" name="legacy-password" placeholder="nouveau mot de passe" />
          <UiInput v-model="confirmPassword" type="password" name="legacy-password-confirm" placeholder="confirmer le mot de passe" />
          <p class="text-xs text-slate-600">
            Regle mot de passe: {{ PASSWORD_MIN_LENGTH }} a {{ PASSWORD_MAX_LENGTH }} caracteres.
          </p>
          <UiButton type="button" @click="configurePassword">
            Configurer le mot de passe
          </UiButton>
        </div>
        <p v-if="authSuccess" class="mt-2 text-sm text-emerald-700">
          {{ authSuccess }}
        </p>
        <p v-if="authError" class="mt-2 text-sm text-red-700">
          {{ authError }}
        </p>
      </UiCardContent>
    </UiCard>

    <p v-if="error" class="mt-4 text-sm font-medium text-red-700">
      {{ error }}
    </p>

    <div class="mt-5 grid gap-4">
      <UiCard
        v-for="key in keys"
        :key="key.id"
        as="article"
      >
        <UiCardContent>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-medium">
                {{ key.fingerprint }}
              </p>
              <p class="text-xs text-slate-600">
                Key ID: {{ key.keyId || 'N/A' }} - Algo: {{ key.algorithm || 'N/A' }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded px-2 py-1 text-xs" :class="key.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                {{ key.status }}
              </span>
              <span v-if="key.isDefault" class="rounded bg-slate-200 px-2 py-1 text-xs text-slate-800">
                default
              </span>
            </div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <UiInput
              v-model="compromiseNote[key.id]"
              type="text"
              :name="`note-${key.id}`"
              placeholder="Note de compromission (optionnel)"
            />
            <UiButton
              type="button"
              variant="secondary"
              :disabled="key.status !== 'active' || key.isDefault"
              @click="makeDefault(key.id)"
            >
              Definir par defaut
            </UiButton>
            <UiButton
              type="button"
              variant="ghost"
              :disabled="key.status === 'compromised'"
              @click="markCompromised(key.id)"
            >
              Signaler compromise
            </UiButton>
          </div>
        </UiCardContent>
      </UiCard>
    </div>
  </main>
</template>
