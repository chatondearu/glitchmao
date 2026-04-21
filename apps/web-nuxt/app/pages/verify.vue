<script setup lang="ts">
const route = useRoute()
const hashFromUrl = computed(() => String(route.query.h ?? route.query.hash ?? ''))
const result = ref<{ status: string; details: string } | null>(null)
const error = ref('')

onMounted(async () => {
  if (!hashFromUrl.value)
    return

  try {
    result.value = await $fetch('/api/verify', {
      query: { hash: hashFromUrl.value },
    })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Verification failed'
  }
})
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-12">
    <h1 class="text-2xl font-semibold text-slate-900">
      Verification Result
    </h1>
    <p class="mt-4 text-sm text-slate-700">
      <strong>Hash:</strong> {{ hashFromUrl || 'N/A' }}
    </p>
    <p v-if="result" class="mt-5 text-sm font-medium" :class="result.status === 'AUTHENTIQUE' ? 'text-emerald-700' : 'text-red-700'">
      {{ result.status }} - {{ result.details }}
    </p>
    <p v-else-if="error" class="mt-5 text-sm font-medium text-red-700">
      {{ error }}
    </p>
    <p v-else class="mt-5 text-sm text-slate-700">
      Provide a hash in URL query: <code>?h=...</code>
    </p>
    <UiLink to="/" class="mt-8">
      Back to verify form
    </UiLink>
  </main>
</template>
