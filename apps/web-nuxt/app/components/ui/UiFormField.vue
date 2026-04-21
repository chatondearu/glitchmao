<script setup lang="ts">
interface Props {
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  error: '',
})
</script>

<template>
  <div class="grid gap-1.5">
    <slot />
    <p
      v-if="props.error"
      class="text-sm text-red-700"
      role="alert"
    >
      {{ props.error }}
    </p>
  </div>
</template>
