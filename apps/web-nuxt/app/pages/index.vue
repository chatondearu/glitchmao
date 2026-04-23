<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
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
    error.value = err instanceof Error
      ? err.message
      : t('errors.verifyFailed')
  }
  finally {
    loadingHash.value = false
  }
}

async function verifyByFile() {
  error.value = ''
  result.value = null
  if (!uploadedFile.value) {
    error.value = t('errors.missingFile')
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
    error.value = err instanceof Error
      ? err.message
      : t('errors.verifyFailed')
  }
  finally {
    loadingFile.value = false
  }
}
</script>

<template>
  <main class="ui-container max-w-3xl py-12">
    <UiCard as="form" variant="primary" class="mt-6" @submit.prevent="verifyByHash">
      <template #header-left>
        {{ t('title') }}
      </template>
      <div class="grid gap-4">
        <UiFormField>
          <UiLabel for="hash-input">
            {{ t('hashLabel') }}
          </UiLabel>
          <UiInput
            id="hash-input"
            v-model="hash"
            type="text"
            name="hash"
            :placeholder="t('hashPlaceholder')"
            required
          />
        </UiFormField>
        <UiButton type="submit" class="w-fit" :disabled="loadingHash || loadingFile">
          {{ loadingHash ? t('verifying') : t('verifyByHash') }}
        </UiButton>
      </div>
    </UiCard>

    <UiCard as="form" variant="primary" class="mt-4" @submit.prevent="verifyByFile">
      <div class="grid gap-4">
          <UiFormField>
            <UiLabel for="file-input">
              {{ t('fileLabel') }}
            </UiLabel>
            <UiFileInput
              id="file-input"
              required
              @change="(file) => uploadedFile = file"
            />
          </UiFormField>
          <UiButton type="submit" class="w-fit" :disabled="loadingHash || loadingFile">
            {{ loadingFile ? t('verifying') : t('verifyByFile') }}
          </UiButton>
      </div>
    </UiCard>

    <p v-if="result" class="ui-meta-mono mt-5" :class="result.status === 'AUTHENTIQUE' ? 'text-primary' : 'text-error'">
      {{ result.status }} - {{ result.details }}
    </p>
    <p v-if="error" class="ui-meta-mono mt-5 text-error">
      {{ error }}
    </p>
  </main>
</template>

<i18n lang="json">
{
  "fr": {
    "title": "Verification GlitchMao",
    "hashLabel": "Hash SHA-256",
    "hashPlaceholder": "Collez le hash du contenu",
    "verifying": "Verification...",
    "verifyByHash": "Verifier par hash",
    "verifyByFile": "Verifier par fichier",
    "fileLabel": "Fichier (image, PDF, texte, etc.)",
    "errors": {
      "verifyFailed": "Echec de verification.",
      "missingFile": "Veuillez selectionner un fichier."
    }
  },
  "en": {
    "title": "GlitchMao Verification",
    "hashLabel": "SHA-256 Hash",
    "hashPlaceholder": "Paste content hash",
    "verifying": "Verifying...",
    "verifyByHash": "Verify by hash",
    "verifyByFile": "Verify by file",
    "fileLabel": "File (image, PDF, text, etc.)",
    "errors": {
      "verifyFailed": "Verification failed.",
      "missingFile": "Please select a file."
    }
  }
}
</i18n>
