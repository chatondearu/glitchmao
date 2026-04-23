<script setup lang="ts">
import { computed, useSlots } from 'vue'

interface Props {
  as?: 'div' | 'section' | 'article' | 'form'
  variant?: 'default' | 'primary' | 'secondary' | 'alert'
  headerLeft?: string
  headerRight?: string
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  variant: 'default',
  headerLeft: '',
  headerRight: '',
})

const slots = useSlots()
const hasHeader = computed(() => {
  return Boolean(
    slots.header
    || slots['header-left']
    || slots['header-right']
    || props.headerLeft
    || props.headerRight,
  )
})

const cardClass = computed(() => {
  if (props.variant === 'primary')
    return 'border-outline-variant bg-surface-container-low text-on-surface'
  if (props.variant === 'secondary')
    return 'border-secondary-container bg-surface-container text-on-surface'
  if (props.variant === 'alert')
    return 'border-error-container/60 bg-surface-container-low text-on-surface'
  return 'border-outline-variant bg-surface-container-low text-on-surface'
})

const headerClass = computed(() => {
  if (props.variant === 'primary')
    return 'border-outline-variant bg-primary-container text-on-primary'
  if (props.variant === 'secondary')
    return 'border-secondary-container bg-secondary-container text-on-secondary-container'
  if (props.variant === 'alert')
    return 'border-error-container/60 bg-error-container text-on-error-container'
  return 'border-outline-variant bg-surface-container-low text-on-surface'
})
</script>

<template>
  <component
    :is="props.as"
    class="flex flex-col border"
    :class="cardClass"
  >
    <div
      v-if="hasHeader"
      class="flex items-center justify-between gap-3 border-b px-4 py-2"
      :class="headerClass"
    >
      <slot name="header">
        <div class="min-w-0 font-tech text-data-mono">
          <slot name="header-left">
            <span>{{ props.headerLeft }}</span>
          </slot>
        </div>
        <div class="shrink-0 text-right font-tech text-[10px] tracking-[0.08em] uppercase opacity-90">
          <slot name="header-right">
            <span>{{ props.headerRight }}</span>
          </slot>
        </div>
      </slot>
    </div>
    <div class="p-4 flex flex-col gap-4">
      <slot />
      <div v-if="slots['content-buttons']" class="flex gap-2">
        <slot name="content-buttons"></slot>
      </div>
    </div>
  </component>
</template>
