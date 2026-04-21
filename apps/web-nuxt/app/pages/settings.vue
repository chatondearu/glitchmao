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
const compromiseNote = ref<Record<string, string>>({})

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

onMounted(loadKeys)
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 py-8">
    <h1 class="text-2xl font-semibold">
      Settings - Cles GPG
    </h1>
    <p class="mt-2 text-sm text-slate-600">
      Vous pouvez definir la cle active par defaut et signaler une cle compromise.
    </p>

    <p v-if="error" class="mt-4 text-sm font-medium text-red-700">
      {{ error }}
    </p>

    <div class="mt-5 grid gap-4">
      <article
        v-for="key in keys"
        :key="key.id"
        class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
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
      </article>
    </div>
  </main>
</template>
