<script setup lang="ts">
interface Props {
  id?: string
  name?: string
  type?: 'text' | 'email' | 'password' | 'search' | 'url'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>

<template>
  <input
    :id="props.id"
    :name="props.name"
    :type="props.type"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :required="props.required"
    :disabled="props.disabled"
    class="ui-input-base placeholder:text-on-surface-variant/70"
    @input="onInput"
  >
</template>
