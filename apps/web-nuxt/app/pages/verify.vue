<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const hashFromUrl = computed(() => String(route.query.h ?? route.query.hash ?? ''))
const idFromUrl = computed(() => String(route.query.id ?? ''))
const hasQuery = computed(() => Boolean(hashFromUrl.value || idFromUrl.value))
const result = ref<{ status: string; details: string } | null>(null)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  if (!hasQuery.value)
    return

  loading.value = true
  try {
    result.value = await $fetch<{ status: string, details: string }>('/api/verify', {
      query: {
        id: idFromUrl.value || undefined,
        hash: hashFromUrl.value || undefined,
      },
    })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.verifyFailed')
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="ui-container max-w-3xl py-12">
    <UiCard variant="primary" class="mt-6">
      <template #header-left>
        {{ t('title') }}
      </template>
      <p class="ui-meta-mono text-on-surface-variant">
        {{ t('intro') }}
      </p>
      <p class="text-body-md text-on-surface-variant">
          <strong>{{ t('signatureId') }}:</strong> {{ idFromUrl || 'N/A' }}
        </p>
        <p class="mt-3 text-body-md text-on-surface-variant">
          <strong>{{ t('hash') }}:</strong> {{ hashFromUrl || 'N/A' }}
        </p>
        <p v-if="loading" class="ui-meta-mono mt-5 text-on-surface-variant">
          {{ t('loading') }}
        </p>
        <div v-else-if="result" class="mt-5 flex flex-col gap-2">
          <UiBadge :variant="result.status === 'AUTHENTIQUE' ? 'success' : 'error'" class="w-fit">
            {{ result.status }}
          </UiBadge>
          <p class="ui-meta-mono m-0 text-on-surface-variant">
            {{ result.details }}
          </p>
          <p class="ui-meta-mono m-0 text-on-surface-variant">
            {{ t('trustHint') }}
          </p>
        </div>
        <p v-else-if="error" class="ui-meta-mono mt-5 text-error">
          {{ error }}
        </p>
        <UiEmptyState
          v-else
          class="mt-5"
          :title="t('missingQueryTitle')"
          :description="t('missingQueryDescription')"
        >
          <p class="m-0 text-body-sm text-on-surface-variant">
            {{ t('helpPrefix') }}<code>?id=...</code>{{ t('helpMiddle') }}<code>?h=...</code>)
          </p>
        </UiEmptyState>
      <UiLink to="/" class="mt-8">
        {{ t('back') }}
      </UiLink>
    </UiCard>
  </main>
</template>

<i18n lang="json">
{
  "fr": {
    "title": "Resultat de verification",
    "intro": "Verification publique de preuve et integrite d une signature.",
    "loading": "Verification en cours...",
    "signatureId": "ID signature",
    "hash": "Hash",
    "helpPrefix": "Fournissez un ID dans l URL: ",
    "helpMiddle": " (ou hash avec ",
    "missingQueryTitle": "Aucune donnee de verification fournie",
    "missingQueryDescription": "Ajoutez un identifiant public ou un hash dans l URL pour lancer la verification.",
    "trustHint": "Conservez ce resultat avec l identifiant public pour documenter la preuve.",
    "back": "Retour au formulaire de verification",
    "errors": {
      "verifyFailed": "Echec de verification."
    }
  },
  "en": {
    "title": "Verification result",
    "intro": "Public verification of signature proof and integrity.",
    "loading": "Verification in progress...",
    "signatureId": "Signature ID",
    "hash": "Hash",
    "helpPrefix": "Provide an ID in URL query: ",
    "helpMiddle": " (or hash with ",
    "missingQueryTitle": "No verification data provided",
    "missingQueryDescription": "Add a public ID or hash in the URL to run verification.",
    "trustHint": "Keep this result with the public ID as part of your audit trail.",
    "back": "Back to verify form",
    "errors": {
      "verifyFailed": "Verification failed."
    }
  }
}
</i18n>
