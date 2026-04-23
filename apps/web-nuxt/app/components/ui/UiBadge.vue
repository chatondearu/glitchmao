<script setup lang="ts">
interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const badgeClassMap: Record<NonNullable<Props['variant']>, string> = {
  default: 'border-outline-variant bg-surface-container-high text-on-surface',
  success: 'border-primary-container/60 bg-primary-container/15 text-primary',
  warning: 'border-secondary-container bg-secondary-container/30 text-on-secondary-container',
  error: 'border-error-container/60 bg-error-container/20 text-on-error-container',
  info: 'border-outline-variant bg-surface-container text-on-surface-variant',
}
</script>

<template>
  <span
    class="inline-flex items-center border px-2 py-1 text-label-caps"
    :class="badgeClassMap[props.variant]"
  >
    <slot />
  </span>
</template>
