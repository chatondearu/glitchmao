<script setup lang="ts">
const hash = ref('')
const uploadedFile = ref<File | null>(null)
const result = ref<{ status: string; details: string } | null>(null)
const error = ref('')
const loadingHash = ref(false)
const loadingFile = ref(false)

async function verifyByHash() {
  error.value = ''
  result.value = null
  loadingHash.value = true

  try {
    const response = await $fetch<{ status: string; details: string }>('/api/verify', {
      query: { hash: hash.value },
    })
    result.value = response
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Verification failed'
  }
  finally {
    loadingHash.value = false
  }
}

async function verifyByFile() {
  error.value = ''
  result.value = null
  if (!uploadedFile.value) {
    error.value = 'Veuillez selectionner un fichier.'
    return
  }

  loadingFile.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadedFile.value)

    const response = await $fetch<{ status: string; details: string }>('/api/verify', {
      method: 'POST',
      body: formData,
    })
    result.value = response
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Verification failed'
  }
  finally {
    loadingFile.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-12">
    <h1 class="text-2xl font-semibold text-slate-900">
      GlitchMao Verification
    </h1>

    <form class="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="verifyByHash">
      <UiFormField>
        <UiLabel for="hash-input">
          SHA-256 Hash
        </UiLabel>
        <UiInput
        id="hash-input"
        v-model="hash"
        type="text"
        name="hash"
        placeholder="Paste content hash"
        required
        />
      </UiFormField>
      <UiButton type="submit" class="w-fit" :disabled="loadingHash || loadingFile">
        {{ loadingHash ? 'Verification...' : 'Verifier par hash' }}
      </UiButton>
    </form>

    <form class="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="verifyByFile">
      <UiFormField>
        <UiLabel for="file-input">
          Fichier (image, PDF, texte, etc.)
        </UiLabel>
        <input
          id="file-input"
          type="file"
          class="w-full text-sm"
          required
          @change="(event) => uploadedFile = (event.target as HTMLInputElement).files?.[0] ?? null"
        >
      </UiFormField>
      <UiButton type="submit" class="w-fit" :disabled="loadingHash || loadingFile">
        {{ loadingFile ? 'Verification...' : 'Verifier par fichier' }}
      </UiButton>
    </form>

    <p v-if="result" class="mt-5 text-sm font-medium" :class="result.status === 'AUTHENTIQUE' ? 'text-emerald-700' : 'text-red-700'">
      {{ result.status }} - {{ result.details }}
    </p>
    <p v-if="error" class="mt-5 text-sm font-medium text-red-700">
      {{ error }}
    </p>
  </main>
</template>
