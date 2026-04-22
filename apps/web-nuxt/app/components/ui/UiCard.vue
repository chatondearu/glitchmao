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
    class="ui-card"
  >
    <slot />
  </component>
</template>
