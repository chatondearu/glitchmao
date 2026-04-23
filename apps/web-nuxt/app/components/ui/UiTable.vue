<script setup lang="ts">
interface Props {
  dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dense: false,
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full text-body-md" :class="props.dense ? 'text-sm' : ''">
      <slot />
    </table>
  </div>
</template>
