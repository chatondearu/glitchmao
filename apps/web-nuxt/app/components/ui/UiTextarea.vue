<script setup lang="ts">
interface Props {
  id?: string
  name?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  required: false,
  disabled: false,
  rows: 4,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>

<template>
  <textarea
    :id="props.id"
    :name="props.name"
    :placeholder="props.placeholder"
    :required="props.required"
    :disabled="props.disabled"
    :rows="props.rows"
    :value="props.modelValue"
    class="ui-input-base placeholder:text-on-surface-variant/70"
    @input="onInput"
  />
</template>
