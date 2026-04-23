<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
interface SignatureItem {
  id: string
  contentHash: string
  creatorId: string
  sourceType: 'image' | 'pdf' | 'text' | 'markdown' | 'plain_text'
  status: 'AUTHENTIQUE' | 'CORROMPU/INCONNU'
  createdAt: string
  profileId: string | null
  verificationUrl: string
  handle: string | null
  displayName: string | null
}

interface ProfileFilterItem {
  profileId: string
  userId: string
  handle: string
  displayName: string
}

const items = ref<SignatureItem[]>([])
const profiles = ref<ProfileFilterItem[]>([])
const sourceType = ref<string>('')
const profileId = ref<string>('')
const from = ref('')
const to = ref('')
const loading = ref(false)
const error = ref('')
const copyError = ref('')
const nextCursor = ref<string | null>(null)
const copiedPublicId = ref<string | null>(null)

async function fetchProfiles() {
  const response = await $fetch<{ items: ProfileFilterItem[] }>('/api/profiles')
  profiles.value = response.items
}

async function fetchSignatures(append = false) {
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<{ items: SignatureItem[]; nextCursor: string | null }>('/api/signatures', {
      query: {
        source_type: sourceType.value || undefined,
        profile_id: profileId.value || undefined,
        from: from.value ? new Date(from.value).toISOString() : undefined,
        to: to.value ? new Date(to.value).toISOString() : undefined,
        cursor: append ? nextCursor.value ?? undefined : undefined,
        limit: 25,
      },
    })
    items.value = append ? [...items.value, ...response.items] : response.items
    nextCursor.value = response.nextCursor
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.loadFailed')
  }
  finally {
    loading.value = false
  }
}

function applyFilters() {
  nextCursor.value = null
  fetchSignatures(false)
}

async function copyPublicId(publicId: string) {
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(publicId)
    copiedPublicId.value = publicId
    setTimeout(() => {
      if (copiedPublicId.value === publicId)
        copiedPublicId.value = null
    }, 1600)
  }
  catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = publicId
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (!copied)
        throw new Error('execCommand copy failed')

      copiedPublicId.value = publicId
      setTimeout(() => {
        if (copiedPublicId.value === publicId)
          copiedPublicId.value = null
      }, 1600)
    }
    catch {
      copyError.value = t('errors.copyFailed')
    }
  }
}

onMounted(async () => {
  await fetchProfiles()
  await fetchSignatures(false)
})
</script>

<template>
  <main class="ui-container py-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-headline-md font-semibold">
          {{ t('title') }}
        </h1>
        <p class="mt-1 text-body-md text-on-surface-variant">
          {{ t('subtitle') }}
        </p>
      </div>
    </div>

    <UiCard as="form" variant="primary" class="mt-5" @submit.prevent="applyFilters">
      <div class="grid gap-3 sm:grid-cols-5">
          <UiFormField>
            <UiLabel for="source-filter">
              Type
              
            </UiLabel>
            <UiSelect id="source-filter" v-model="sourceType">
              <option value="">
                {{ t('all') }}
              </option>
              <option value="image">
                Image
              </option>
              <option value="pdf">
                PDF
              </option>
              <option value="text">
                {{ t('text') }}
              </option>
              <option value="markdown">
                Markdown
              </option>
              <option value="plain_text">
                {{ t('plainText') }}
              </option>
            </UiSelect>
          </UiFormField>
          <UiFormField>
            <UiLabel for="profile-filter">
              {{ t('profile') }}
            </UiLabel>
            <UiSelect id="profile-filter" v-model="profileId">
              <option value="">
                {{ t('all') }}
              </option>
              <option v-for="profile in profiles" :key="profile.profileId" :value="profile.profileId">
                {{ profile.displayName }} (@{{ profile.handle }})
              </option>
            </UiSelect>
          </UiFormField>
          <UiFormField>
            <UiLabel for="from-filter">
              {{ t('from') }}
            </UiLabel>
            <UiInput id="from-filter" v-model="from" type="date" name="from-filter" />
          </UiFormField>
          <UiFormField>
            <UiLabel for="to-filter">
              {{ t('to') }}
            </UiLabel>
            <UiInput id="to-filter" v-model="to" type="date" name="to-filter" />
          </UiFormField>
          <div class="flex items-end">
            <UiButton type="submit" class="w-full">
              {{ t('filter') }}
            </UiButton>
          </div>
      </div>
    </UiCard>

    <p v-if="loading" class="ui-meta-mono mt-4">
      {{ t('loading') }}
    </p>
    <p v-if="error" class="ui-meta-mono mt-4 text-error">
      {{ error }}
    </p>
    <p v-if="copyError" class="ui-meta-mono mt-2 text-primary-container">
      {{ copyError }}
    </p>

    <UiCard v-if="!loading" class="mt-4 overflow-x-auto">
      <table class="min-w-full text-body-md">
        <thead class="bg-surface-container-high text-left text-label-caps text-on-surface-variant">
          <tr>
            <th class="px-3 py-2">
              Date
              
            </th>
            <th class="px-3 py-2">
              {{ t('type') }}
            </th>
            <th class="px-3 py-2">
              {{ t('profile') }}
            </th>
            <th class="px-3 py-2">
              {{ t('status') }}
            </th>
            <th class="px-3 py-2">
              {{ t('publicId') }}
            </th>
            <th class="px-3 py-2">
              {{ t('hash') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-t border-outline-variant">
            <td class="px-3 py-2 whitespace-nowrap">
              {{ new Date(item.createdAt).toLocaleString() }}
            </td>
            <td class="px-3 py-2">
              {{ item.sourceType }}
            </td>
            <td class="px-3 py-2">
              {{ item.displayName ?? item.handle ?? item.creatorId }}
            </td>
            <td class="px-3 py-2">
              <span :class="item.status === 'AUTHENTIQUE' ? 'text-primary' : 'text-error'">
                {{ item.status }}
              </span>
            </td>
            <td class="px-3 py-2 font-mono text-label-mono whitespace-nowrap">
              <div class="flex items-center gap-2">
                <UiButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="h-auto px-1 py-0.5 font-mono"
                  :title="t('copyItem', { id: item.id })"
                  @click="copyPublicId(item.id)"
                >
                  {{ item.id }}
                </UiButton>
                <UiButton type="button" variant="secondary" size="sm" class="px-2 py-1 text-xs" @click="copyPublicId(item.id)">
                  {{ copiedPublicId === item.id ? t('copied') : t('copy') }}
                </UiButton>
              </div>
            </td>
            <td class="px-3 py-2 font-mono text-label-mono">
              {{ item.contentHash.slice(0, 16) }}...
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="6" class="px-3 py-6 text-center text-on-surface-variant">
              {{ t('empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </UiCard>
    <div v-if="nextCursor" class="mt-4 flex justify-center">
      <UiButton type="button" variant="secondary" @click="fetchSignatures(true)">
        {{ t('loadMore') }}
      </UiButton>
    </div>
  </main>
</template>

<i18n lang="json">
{
  "fr": {
    "title": "Signatures",
    "subtitle": "Liste des signatures creees, filtrable par type et periode.",
    "all": "Tous",
    "text": "Texte",
    "plainText": "Texte simple",
    "profile": "Profil",
    "from": "De",
    "to": "A",
    "filter": "Filtrer",
    "loading": "Chargement...",
    "type": "Type",
    "status": "Statut",
    "publicId": "ID public",
    "hash": "Hash",
    "copy": "Copier",
    "copied": "Copie",
    "copyItem": "Copier {id}",
    "empty": "Aucune signature.",
    "loadMore": "Charger plus",
    "errors": {
      "loadFailed": "Impossible de charger les signatures.",
      "copyFailed": "Impossible de copier automatiquement. Copie manuelle requise."
    }
  },
  "en": {
    "title": "Signatures",
    "subtitle": "List of created signatures, filterable by type and period.",
    "all": "All",
    "text": "Text",
    "plainText": "Plain text",
    "profile": "Profile",
    "from": "From",
    "to": "To",
    "filter": "Filter",
    "loading": "Loading...",
    "type": "Type",
    "status": "Status",
    "publicId": "Public ID",
    "hash": "Hash",
    "copy": "Copy",
    "copied": "Copied",
    "copyItem": "Copy {id}",
    "empty": "No signatures.",
    "loadMore": "Load more",
    "errors": {
      "loadFailed": "Failed to load signatures.",
      "copyFailed": "Could not copy automatically. Please copy manually."
    }
  }
}
</i18n>
