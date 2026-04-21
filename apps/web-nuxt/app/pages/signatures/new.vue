<script setup lang="ts">
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
    throw new Error('File is required for image or PDF source')

  return toHex(await crypto.subtle.digest('SHA-256', await uploadedFile.value.arrayBuffer()))
}

async function submitSignature() {
  error.value = ''
  result.value = null
  copyStatus.value = 'idle'
  loading.value = true
  try {
    const contentHash = await computeHashFromSource()
    result.value = await $fetch('/api/signatures', {
      method: 'POST',
      body: {
        content_hash: contentHash,
        creator_id: creatorId.value || undefined,
        source_type: sourceType.value,
        content_mime_type: uploadedFile.value?.type || undefined,
        status: status.value,
      },
    })
    verificationLink.value = result.value.verification_url || ''
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Signature creation failed'
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
  <main class="mx-auto max-w-3xl px-4 py-8">
    <h1 class="text-2xl font-semibold">
      Creer une signature
    </h1>
    <form class="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="submitSignature">
      <UiFormField>
        <UiLabel for="source-type">
          Type de source
        </UiLabel>
        <select id="source-type" v-model="sourceType" class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="plain_text">
            Texte simple
          </option>
          <option value="text">
            Fichier texte
          </option>
          <option value="markdown">
            Texte markdown
          </option>
          <option value="image">
            Image
          </option>
          <option value="pdf">
            PDF
          </option>
        </select>
      </UiFormField>

      <UiFormField v-if="sourceType === 'plain_text'">
        <UiLabel for="plain-text">
          Texte a signer
        </UiLabel>
        <textarea id="plain-text" v-model="plainText" class="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      </UiFormField>

      <UiFormField v-if="sourceType === 'text'">
        <UiLabel for="text-content">
          Contenu texte
        </UiLabel>
        <textarea id="text-content" v-model="textContent" class="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      </UiFormField>

      <UiFormField v-if="sourceType === 'markdown'">
        <UiLabel for="markdown-content">
          Contenu markdown
        </UiLabel>
        <textarea id="markdown-content" v-model="markdownContent" class="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      </UiFormField>

      <UiFormField v-if="sourceType === 'image' || sourceType === 'pdf'">
        <UiLabel for="upload-file">
          Fichier a signer
        </UiLabel>
        <input id="upload-file" type="file" :accept="sourceType === 'image' ? 'image/*' : 'application/pdf'" class="w-full text-sm" required @change="(event) => uploadedFile = (event.target as HTMLInputElement).files?.[0] ?? null">
      </UiFormField>

      <UiFormField>
        <UiLabel for="creator-id">
          Creator ID (optionnel)
        </UiLabel>
        <UiInput id="creator-id" v-model="creatorId" type="text" name="creator-id" placeholder="ex: alice" />
      </UiFormField>

      <UiButton type="submit" :disabled="loading">
        {{ loading ? 'Creation...' : 'Enregistrer la signature' }}
      </UiButton>
    </form>

    <p
      v-if="result"
      class="mt-4 text-sm font-medium"
      :class="result.status === 'already_exists' ? 'text-amber-700' : 'text-emerald-700'"
    >
      {{ result.status === 'already_exists' ? `Signature deja existante (ID: ${result.id}).` : `Signature enregistree avec succes (ID: ${result.id}).` }}
    </p>
    <div v-if="verificationLink" class="mt-3 flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
      <p class="min-w-0 flex-1 truncate text-xs text-slate-700">
        {{ verificationLink }}
      </p>
      <UiButton type="button" variant="secondary" @click="copyVerificationLink">
        Copier le lien de verification
      </UiButton>
    </div>
    <p v-if="copyStatus === 'success'" class="mt-2 text-sm font-medium text-emerald-700">
      Lien de verification copie.
    </p>
    <p v-else-if="copyStatus === 'error'" class="mt-2 text-sm font-medium text-red-700">
      Impossible de copier automatiquement. Copiez le lien manuellement.
    </p>
    <p v-if="error" class="mt-4 text-sm font-medium text-red-700">
      {{ error }}
    </p>
  </main>
</template>
