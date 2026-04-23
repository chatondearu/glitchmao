<script setup lang="ts">
interface Props {
  id?: string
  label: string
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  error: '',
  hint: '',
})
</script>

<template>
  <UiFormField :error="props.error">
    <UiLabel v-if="props.id" :for="props.id">
      {{ props.label }}
    </UiLabel>
    <UiLabel v-else>
      {{ props.label }}
    </UiLabel>
    <slot />
    <p v-if="props.hint" class="ui-meta-mono text-on-surface-variant">
      {{ props.hint }}
    </p>
  </UiFormField>
</template>
