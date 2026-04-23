<script setup lang="ts">
interface Props {
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 border border-outline-variant bg-surface-container-low px-4 py-8 text-center">
    <p v-if="props.title" class="m-0 text-body-lg font-semibold text-on-surface">
      {{ props.title }}
    </p>
    <p v-if="props.description" class="m-0 text-body-md text-on-surface-variant">
      {{ props.description }}
    </p>
    <slot />
  </div>
</template>
