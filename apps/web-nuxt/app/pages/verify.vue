<script setup lang="ts">
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
    error.value = err instanceof Error ? err.message : 'Verification failed'
  }
})
</script>

<template>
  <main class="ui-container max-w-3xl py-12">
    <UiCard class="mt-6">
      <UiCardContent>
        <UiCardHeader>
          <h1 class="text-headline-md font-semibold text-on-surface">
            Verification Result
          </h1>
        </UiCardHeader>
        <p class="mt-3 text-body-md text-on-surface-variant">
          <strong>Signature ID:</strong> {{ idFromUrl || 'N/A' }}
        </p>
        <p class="mt-4 text-body-md text-on-surface-variant">
          <strong>Hash:</strong> {{ hashFromUrl || 'N/A' }}
        </p>
        <p v-if="result" class="ui-meta-mono mt-5" :class="result.status === 'AUTHENTIQUE' ? 'text-primary' : 'text-error'">
          {{ result.status }} - {{ result.details }}
        </p>
        <p v-else-if="error" class="ui-meta-mono mt-5 text-error">
          {{ error }}
        </p>
        <p v-else class="mt-5 text-body-md text-on-surface-variant">
          Provide an ID in URL query: <code>?id=...</code> (or hash with <code>?h=...</code>)
        </p>
        <UiLink to="/" class="mt-8">
          Back to verify form
        </UiLink>
      </UiCardContent>
    </UiCard>
  </main>
</template>
