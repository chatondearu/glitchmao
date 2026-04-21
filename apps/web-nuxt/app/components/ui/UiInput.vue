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
    class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-100"
    @input="onInput"
  >
</template>
