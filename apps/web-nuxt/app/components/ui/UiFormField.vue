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
      class="text-label-mono text-error uppercase"
      role="alert"
    >
      {{ props.error }}
    </p>
  </div>
</template>
