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
  <main class="mx-auto max-w-2xl px-4 py-12">
    <h1 class="text-2xl font-semibold text-slate-900">
      GlitchMao Verification
    </h1>

    <form class="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="verifyByHash">
      <UiFormField>
        <UiLabel for="hash-input">
          SHA-256 Hash
        </UiLabel>
        <UiInput
        id="hash-input"
        v-model="hash"
        type="text"
        name="hash"
        placeholder="Paste content hash"
        required
        />
      </UiFormField>
      <UiButton type="submit" class="w-fit">
        Verify
      </UiButton>
    </form>

    <p v-if="result" class="mt-5 text-sm font-medium" :class="result.status === 'AUTHENTIQUE' ? 'text-emerald-700' : 'text-red-700'">
      {{ result.status }} - {{ result.details }}
    </p>
    <p v-if="error" class="mt-5 text-sm font-medium text-red-700">
      {{ error }}
    </p>
  </main>
</template>
