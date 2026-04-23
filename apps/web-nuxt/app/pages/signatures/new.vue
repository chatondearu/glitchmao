<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
type SourceType = 'image' | 'pdf' | 'text' | 'markdown' | 'plain_text'

const sourceType = ref<SourceType>('plain_text')
const plainText = ref('')
const textContent = ref('')
const markdownContent = ref('')
const uploadedFile = ref<File | null>(null)
const creatorId = ref('')
const status = ref<'AUTHENTIQUE' | 'CORROMPU/INCONNU'>('AUTHENTIQUE')
const result = ref<{ id: string; status: 'stored' | 'already_exists'; verification_url?: string } | null>(null)
const verificationLink = ref('')
const copyStatus = ref<'idle' | 'success' | 'error'>('idle')
const error = ref('')
const loading = ref(false)

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function computeHashFromSource() {
  if (sourceType.value === 'plain_text')
    return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plainText.value)))
  if (sourceType.value === 'text')
    return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(textContent.value)))
  if (sourceType.value === 'markdown')
    return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(markdownContent.value)))
  if (!uploadedFile.value)
    throw new Error(t('errors.missingFile'))

  return toHex(await crypto.subtle.digest('SHA-256', await uploadedFile.value.arrayBuffer()))
}

async function submitSignature() {
  error.value = ''
  result.value = null
  copyStatus.value = 'idle'
  loading.value = true
  try {
    const contentHash = await computeHashFromSource()
    const created = await $fetch<{ id: string, status: 'stored' | 'already_exists', verification_url?: string }>('/api/signatures', {
      method: 'POST',
      body: {
        content_hash: contentHash,
        creator_id: creatorId.value || undefined,
        source_type: sourceType.value,
        content_mime_type: uploadedFile.value?.type || undefined,
        status: status.value,
      },
    })
    result.value = created
    verificationLink.value = created.verification_url || ''
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.signatureCreateFailed')
  }
  finally {
    loading.value = false
  }
}

async function copyVerificationLink() {
  if (!verificationLink.value)
    return

  try {
    await navigator.clipboard.writeText(verificationLink.value)
    copyStatus.value = 'success'
  }
  catch {
    copyStatus.value = 'error'
  }
}
</script>

<template>
  <main class="ui-container max-w-4xl py-8">
    <h1 class="text-headline-md font-semibold">
      {{ t('signatures.createTitle') }}
    </h1>
    <UiCard as="form" variant="primary" class="mt-6" @submit.prevent="submitSignature">
      <div class="grid gap-4">
          <UiFormField>
            <UiLabel for="source-type">
              {{ t('signatures.sourceType') }}
            </UiLabel>
            <UiSelect id="source-type" v-model="sourceType">
              <option value="plain_text">
                {{ t('signatures.plainText') }}
              </option>
              <option value="text">
                {{ t('signatures.text') }}
              </option>
              <option value="markdown">
                {{ t('signatures.markdown') }}
              </option>
              <option value="image">
                {{ t('signatures.image') }}
              </option>
              <option value="pdf">
                {{ t('signatures.pdf') }}
              </option>
            </UiSelect>
          </UiFormField>

          <UiFormField v-if="sourceType === 'plain_text'">
            <UiLabel for="plain-text">
              {{ t('signatures.textToSign') }}
            </UiLabel>
            <UiTextarea id="plain-text" v-model="plainText" :rows="6" required />
          </UiFormField>

          <UiFormField v-if="sourceType === 'text'">
            <UiLabel for="text-content">
              {{ t('signatures.textToSign') }}
            </UiLabel>
            <UiTextarea id="text-content" v-model="textContent" :rows="6" required />
          </UiFormField>

          <UiFormField v-if="sourceType === 'markdown'">
            <UiLabel for="markdown-content">
              {{ t('signatures.markdown') }}
            </UiLabel>
            <UiTextarea id="markdown-content" v-model="markdownContent" :rows="6" required />
          </UiFormField>

          <UiFormField v-if="sourceType === 'image' || sourceType === 'pdf'">
            <UiLabel for="upload-file">
              {{ t('signatures.fileToSign') }}
            </UiLabel>
            <UiFileInput
              id="upload-file"
              :accept="sourceType === 'image' ? 'image/*' : 'application/pdf'"
              required
              @change="(file) => uploadedFile = file"
            />
          </UiFormField>

          <UiFormField>
            <UiLabel for="creator-id">
              {{ t('signatures.creatorId') }}
            </UiLabel>
            <UiInput id="creator-id" v-model="creatorId" type="text" name="creator-id" placeholder="ex: alice" />
          </UiFormField>

          <UiButton type="submit" :disabled="loading">
            {{ loading ? t('signatures.creating') : t('signatures.saveAction') }}
          </UiButton>
      </div>
    </UiCard>

    <p
      v-if="result"
      class="ui-meta-mono mt-4"
      :class="result.status === 'already_exists' ? 'text-on-surface-variant' : 'text-primary'"
    >
      {{ result.status === 'already_exists' ? t('signatures.alreadyExists', { id: result.id }) : t('signatures.created', { id: result.id }) }}
    </p>
    <div v-if="verificationLink" class="mt-3 flex flex-col gap-2 border border-outline-variant bg-surface-container p-3 sm:flex-row sm:items-center">
      <p class="ui-meta-mono min-w-0 flex-1 truncate">
        {{ verificationLink }}
      </p>
      <UiButton type="button" variant="secondary" @click="copyVerificationLink">
        {{ t('signatures.copyLink') }}
      </UiButton>
    </div>
    <p v-if="copyStatus === 'success'" class="ui-meta-mono mt-2 text-primary">
      {{ t('signatures.copySuccess') }}
    </p>
    <p v-else-if="copyStatus === 'error'" class="ui-meta-mono mt-2 text-error">
      {{ t('signatures.copyError') }}
    </p>
    <p v-if="error" class="ui-meta-mono mt-4 text-error">
      {{ error }}
    </p>
  </main>
</template>

<i18n lang="json">
{
  "fr": {
    "signatures": {
      "createTitle": "Creer une signature",
      "sourceType": "Type de source",
      "plainText": "Texte simple",
      "text": "Texte",
      "markdown": "Markdown",
      "image": "Image",
      "pdf": "PDF",
      "textToSign": "Texte a signer",
      "fileToSign": "Fichier a signer",
      "creatorId": "Creator ID (optionnel)",
      "saveAction": "Enregistrer la signature",
      "creating": "Creation...",
      "alreadyExists": "Signature deja existante (ID: {id}).",
      "created": "Signature enregistree avec succes (ID: {id}).",
      "copyLink": "Copier le lien de verification",
      "copySuccess": "Lien de verification copie.",
      "copyError": "Impossible de copier automatiquement. Copiez le lien manuellement."
    },
    "errors": {
      "missingFile": "Veuillez selectionner un fichier.",
      "signatureCreateFailed": "Echec de creation de signature."
    }
  },
  "en": {
    "signatures": {
      "createTitle": "Create signature",
      "sourceType": "Source type",
      "plainText": "Plain text",
      "text": "Text",
      "markdown": "Markdown",
      "image": "Image",
      "pdf": "PDF",
      "textToSign": "Text to sign",
      "fileToSign": "File to sign",
      "creatorId": "Creator ID (optional)",
      "saveAction": "Save signature",
      "creating": "Creating...",
      "alreadyExists": "Signature already exists (ID: {id}).",
      "created": "Signature saved successfully (ID: {id}).",
      "copyLink": "Copy verification link",
      "copySuccess": "Verification link copied.",
      "copyError": "Could not copy automatically. Please copy it manually."
    },
    "errors": {
      "missingFile": "Please select a file.",
      "signatureCreateFailed": "Signature creation failed."
    }
  }
}
</i18n>
