<script setup lang="ts">
const hash = ref('')
const result = ref<{ status: string; details: string } | null>(null)
const error = ref('')

async function verifyByHash() {
  error.value = ''
  result.value = null

  try {
    const response = await $fetch<{ status: string; details: string }>('/api/verify', {
      query: { hash: hash.value },
    })
    result.value = response
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Verification failed'
  }
}
</script>

<template>
  <main class="container">
    <h1>GlitchMao Verification</h1>

    <form class="card" @submit.prevent="verifyByHash">
      <label for="hash-input">SHA-256 Hash</label>
      <input
        id="hash-input"
        v-model="hash"
        type="text"
        name="hash"
        placeholder="Paste content hash"
        required
      >
      <button type="submit">
        Verify
      </button>
    </form>

    <p v-if="result" :class="result.status === 'AUTHENTIQUE' ? 'ok' : 'ko'">
      {{ result.status }} - {{ result.details }}
    </p>
    <p v-if="error" class="ko">
      {{ error }}
    </p>
  </main>
</template>

<style scoped>
.container {
  max-width: 768px;
  margin: 4rem auto;
  padding: 0 1rem;
}

.card {
  display: grid;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

input {
  border: 1px solid #999;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

button {
  width: fit-content;
  border: 1px solid #444;
  border-radius: 0.5rem;
  padding: 0.6rem 0.9rem;
  background: #fff;
  cursor: pointer;
}

.ok {
  color: #0a8a3d;
}

.ko {
  color: #b42318;
}
</style>
