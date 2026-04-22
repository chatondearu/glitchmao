<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const hashFromUrl = computed(() => String(route.query.h ?? route.query.hash ?? ''))
const idFromUrl = computed(() => String(route.query.id ?? ''))
const result = ref<{ status: string; details: string } | null>(null)
const error = ref('')

onMounted(async () => {
  if (!hashFromUrl.value && !idFromUrl.value)
    return

  try {
    result.value = await $fetch('/api/verify', {
      query: {
        id: idFromUrl.value || undefined,
        hash: hashFromUrl.value || undefined,
      },
    })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.verifyFailed')
  }
})
</script>

<template>
  <main class="ui-container max-w-3xl py-12">
    <UiCard class="mt-6">
      <UiCardContent>
        <UiCardHeader>
          <h1 class="text-headline-md font-semibold text-on-surface">
            {{ t('title') }}
          </h1>
        </UiCardHeader>
        <p class="mt-3 text-body-md text-on-surface-variant">
          <strong>{{ t('signatureId') }}:</strong> {{ idFromUrl || 'N/A' }}
        </p>
        <p class="mt-4 text-body-md text-on-surface-variant">
          <strong>{{ t('hash') }}:</strong> {{ hashFromUrl || 'N/A' }}
        </p>
        <p v-if="result" class="ui-meta-mono mt-5" :class="result.status === 'AUTHENTIQUE' ? 'text-primary' : 'text-error'">
          {{ result.status }} - {{ result.details }}
        </p>
        <p v-else-if="error" class="ui-meta-mono mt-5 text-error">
          {{ error }}
        </p>
        <p v-else class="mt-5 text-body-md text-on-surface-variant">
          {{ t('helpPrefix') }}<code>?id=...</code>{{ t('helpMiddle') }}<code>?h=...</code>)
        </p>
        <UiLink to="/" class="mt-8">
          {{ t('back') }}
        </UiLink>
      </UiCardContent>
    </UiCard>
  </main>
</template>

<i18n lang="json">
{
  "fr": {
    "title": "Resultat de verification",
    "signatureId": "ID signature",
    "hash": "Hash",
    "helpPrefix": "Fournissez un ID dans l URL: ",
    "helpMiddle": " (ou hash avec ",
    "back": "Retour au formulaire de verification",
    "errors": {
      "verifyFailed": "Echec de verification."
    }
  },
  "en": {
    "title": "Verification result",
    "signatureId": "Signature ID",
    "hash": "Hash",
    "helpPrefix": "Provide an ID in URL query: ",
    "helpMiddle": " (or hash with ",
    "back": "Back to verify form",
    "errors": {
      "verifyFailed": "Verification failed."
    }
  }
}
</i18n>
