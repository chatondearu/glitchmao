<script setup lang="ts">
interface Props {
  as?: 'div' | 'section' | 'article' | 'form'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
})
</script>

<template>
  <component
    :is="props.as"
    class="rounded-lg border border-slate-200 bg-white shadow-sm"
  >
    <slot />
  </component>
</template>
