<script setup lang="ts">
import { computed, useSlots } from 'vue'

interface Props {
  as?: 'div' | 'section' | 'article' | 'form'
  variant?: 'default' | 'primary'
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

const headerClass = computed(() => {
  if (props.variant === 'primary')
    return 'bg-primary-container text-on-primary'
  return 'bg-surface-container-low text-on-surface'
})
</script>

<template>
  <component
    :is="props.as"
    class="flex flex-col border border-outline-variant bg-surface-container-low text-on-surface"
  >
    <div
      v-if="hasHeader"
      class="flex items-center justify-between gap-3 border-b px-3 py-1"
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
