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
  <main class="container">
    <h1>Verification Result</h1>
    <p><strong>Hash:</strong> {{ hashFromUrl || 'N/A' }}</p>
    <p v-if="result" :class="result.status === 'AUTHENTIQUE' ? 'ok' : 'ko'">
      {{ result.status }} - {{ result.details }}
    </p>
    <p v-else-if="error" class="ko">
      {{ error }}
    </p>
    <p v-else>
      Provide a hash in URL query: <code>?h=...</code>
    </p>
  </main>
</template>

<style scoped>
.container {
  max-width: 768px;
  margin: 4rem auto;
  padding: 0 1rem;
}

.ok {
  color: #0a8a3d;
}

.ko {
  color: #b42318;
}
</style>
