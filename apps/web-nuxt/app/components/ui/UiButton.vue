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
  primary: 'border-primary-container bg-primary-container text-on-primary hover:brightness-110',
  secondary: 'border-secondary bg-transparent text-secondary hover:border-primary-container hover:text-primary-container',
  ghost: 'border-outline-variant bg-transparent text-on-surface-variant hover:border-primary-container hover:text-primary-container',
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
