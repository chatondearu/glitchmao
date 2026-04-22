<script setup lang="ts">
interface Props {
  to: string
  external?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  external: false,
})
</script>

<template>
  <a
    v-if="props.external"
    :href="props.to"
    target="_blank"
    rel="noreferrer noopener"
    class="inline-flex items-center gap-1 text-primary-container underline-offset-4 transition hover:opacity-80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
  >
    <slot />
  </a>
  <NuxtLink
    v-else
    :to="props.to"
    class="inline-flex items-center gap-1 text-primary-container underline-offset-4 transition hover:opacity-80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
  >
    <slot />
  </NuxtLink>
</template>
