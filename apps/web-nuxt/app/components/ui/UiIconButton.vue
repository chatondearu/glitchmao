<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  active?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  active: false,
  disabled: false,
})
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    class="inline-flex h-10 w-10 items-center justify-center border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60 disabled:cursor-not-allowed disabled:opacity-60"
    :class="props.active
      ? 'border-primary-container bg-primary-container/10 text-primary-container'
      : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary-container/50 hover:text-primary-container'"
  >
    <slot />
  </button>
</template>
