<script setup lang="ts">
interface Props {
  modelValue: string
  disabled?: boolean
  name?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  name: undefined,
  id: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [event: Event]
}>()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  const value = target?.value ?? ''
  emit('update:modelValue', value)
  emit('change', event)
}
</script>

<template>
  <select
    :id="props.id"
    :name="props.name"
    :value="props.modelValue"
    :disabled="props.disabled"
    class="ui-input-base h-10"
    @change="onChange"
  >
    <slot />
  </select>
</template>
