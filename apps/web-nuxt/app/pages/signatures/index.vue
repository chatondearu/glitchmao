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
  <main class="mx-auto max-w-5xl px-4 py-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold">
          Signatures
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Liste des signatures creees, filtrable par type et periode.
        </p>
      </div>
    </div>

    <form class="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-5" @submit.prevent="applyFilters">
      <UiFormField>
        <UiLabel for="source-filter">
          Type
        </UiLabel>
        <select id="source-filter" v-model="sourceType" class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
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
        </select>
      </UiFormField>
      <UiFormField>
        <UiLabel for="profile-filter">
          Profil
        </UiLabel>
        <select id="profile-filter" v-model="profileId" class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">
            Tous
          </option>
          <option v-for="profile in profiles" :key="profile.profileId" :value="profile.profileId">
            {{ profile.displayName }} (@{{ profile.handle }})
          </option>
        </select>
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
    </form>

    <p v-if="loading" class="mt-4 text-sm text-slate-600">
      Chargement...
    </p>
    <p v-if="error" class="mt-4 text-sm font-medium text-red-700">
      {{ error }}
    </p>
    <p v-if="copyError" class="mt-2 text-sm font-medium text-amber-700">
      {{ copyError }}
    </p>

    <div v-if="!loading" class="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-100 text-left text-slate-700">
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
          <tr v-for="item in items" :key="item.id" class="border-t border-slate-100">
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
              <span :class="item.status === 'AUTHENTIQUE' ? 'text-emerald-700' : 'text-red-700'">
                {{ item.status }}
              </span>
            </td>
            <td class="px-3 py-2 font-mono text-xs whitespace-nowrap">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="cursor-copy rounded px-1 py-0.5 text-left hover:bg-slate-100"
                  :title="`Copier ${item.id}`"
                  @click="copyPublicId(item.id)"
                >
                  {{ item.id }}
                </button>
                <UiButton type="button" variant="secondary" class="px-2 py-1 text-xs" @click="copyPublicId(item.id)">
                  {{ copiedPublicId === item.id ? 'Copie' : 'Copier' }}
                </UiButton>
              </div>
            </td>
            <td class="px-3 py-2 font-mono text-xs">
              {{ item.contentHash.slice(0, 16) }}...
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="6" class="px-3 py-6 text-center text-slate-500">
              Aucune signature.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="nextCursor" class="mt-4 flex justify-center">
      <UiButton type="button" variant="secondary" @click="fetchSignatures(true)">
        Charger plus
      </UiButton>
    </div>
  </main>
</template>
