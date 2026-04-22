<script setup lang="ts">
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
    error.value = err instanceof Error ? err.message : 'Failed to load signatures'
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
      copyError.value = 'Impossible de copier automatiquement. Copie manuelle requise.'
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
          Signatures
        </h1>
        <p class="mt-1 text-body-md text-on-surface-variant">
          Liste des signatures creees, filtrable par type et periode.
        </p>
      </div>
    </div>

    <UiCard as="form" class="mt-5" @submit.prevent="applyFilters">
      <UiCardContent>
        <div class="grid gap-3 sm:grid-cols-5">
          <UiFormField>
            <UiLabel for="source-filter">
              Type
            </UiLabel>
            <UiSelect id="source-filter" v-model="sourceType">
              <option value="">
                Tous
              </option>
              <option value="image">
                Image
              </option>
              <option value="pdf">
                PDF
              </option>
              <option value="text">
                Texte
              </option>
              <option value="markdown">
                Markdown
              </option>
              <option value="plain_text">
                Texte simple
              </option>
            </UiSelect>
          </UiFormField>
          <UiFormField>
            <UiLabel for="profile-filter">
              Profil
            </UiLabel>
            <UiSelect id="profile-filter" v-model="profileId">
              <option value="">
                Tous
              </option>
              <option v-for="profile in profiles" :key="profile.profileId" :value="profile.profileId">
                {{ profile.displayName }} (@{{ profile.handle }})
              </option>
            </UiSelect>
          </UiFormField>
          <UiFormField>
            <UiLabel for="from-filter">
              De
            </UiLabel>
            <UiInput id="from-filter" v-model="from" type="date" name="from-filter" />
          </UiFormField>
          <UiFormField>
            <UiLabel for="to-filter">
              A
            </UiLabel>
            <UiInput id="to-filter" v-model="to" type="date" name="to-filter" />
          </UiFormField>
          <div class="flex items-end">
            <UiButton type="submit" class="w-full">
              Filtrer
            </UiButton>
          </div>
        </div>
      </UiCardContent>
    </UiCard>

    <p v-if="loading" class="ui-meta-mono mt-4">
      Chargement...
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
              Type
            </th>
            <th class="px-3 py-2">
              Profil
            </th>
            <th class="px-3 py-2">
              Statut
            </th>
            <th class="px-3 py-2">
              ID public
            </th>
            <th class="px-3 py-2">
              Hash
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
                  :title="`Copier ${item.id}`"
                  @click="copyPublicId(item.id)"
                >
                  {{ item.id }}
                </UiButton>
                <UiButton type="button" variant="secondary" size="sm" class="px-2 py-1 text-xs" @click="copyPublicId(item.id)">
                  {{ copiedPublicId === item.id ? 'Copie' : 'Copier' }}
                </UiButton>
              </div>
            </td>
            <td class="px-3 py-2 font-mono text-label-mono">
              {{ item.contentHash.slice(0, 16) }}...
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="6" class="px-3 py-6 text-center text-on-surface-variant">
              Aucune signature.
            </td>
          </tr>
        </tbody>
      </table>
    </UiCard>
    <div v-if="nextCursor" class="mt-4 flex justify-center">
      <UiButton type="button" variant="secondary" @click="fetchSignatures(true)">
        Charger plus
      </UiButton>
    </div>
  </main>
</template>
