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
  <main class="ui-container max-w-3xl py-12">
    <UiCard as="form" class="mt-6" @submit.prevent="verifyByHash">
      <UiCardContent>
        <UiCardHeader>
          <h1 class="text-headline-md font-semibold text-on-surface">
            GlitchMao Verification
          </h1>
        </UiCardHeader>
        <div class="mt-4 grid gap-4">
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
        </div>
      </UiCardContent>
    </UiCard>

    <UiCard as="form" class="mt-4" @submit.prevent="verifyByFile">
      <UiCardContent>
        <div class="grid gap-4">
          <UiFormField>
            <UiLabel for="file-input">
              Fichier (image, PDF, texte, etc.)
            </UiLabel>
            <UiFileInput
              id="file-input"
              required
              @change="(file) => uploadedFile = file"
            />
          </UiFormField>
          <UiButton type="submit" class="w-fit" :disabled="loadingHash || loadingFile">
            {{ loadingFile ? 'Verification...' : 'Verifier par fichier' }}
          </UiButton>
        </div>
      </UiCardContent>
    </UiCard>

    <p v-if="result" class="ui-meta-mono mt-5" :class="result.status === 'AUTHENTIQUE' ? 'text-primary' : 'text-error'">
      {{ result.status }} - {{ result.details }}
    </p>
    <p v-if="error" class="ui-meta-mono mt-5 text-error">
      {{ error }}
    </p>
  </main>
</template>
