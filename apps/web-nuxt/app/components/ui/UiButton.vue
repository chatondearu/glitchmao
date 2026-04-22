<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
})

const variantClassMap: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-primary-container text-on-primary hover:opacity-85',
  secondary: 'border-primary-container bg-transparent text-primary-container hover:bg-primary-container hover:text-on-primary',
  ghost: 'border-outline-variant bg-surface-container-high text-on-surface hover:bg-surface-bright',
}

const sizeClassMap: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-body-md',
}
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    class="ui-button-base"
    :class="[variantClassMap[props.variant], sizeClassMap[props.size]]"
  >
    <slot />
  </button>
</template>
