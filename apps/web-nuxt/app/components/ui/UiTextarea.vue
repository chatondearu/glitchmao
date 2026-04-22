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
    class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-100"
    @input="onInput"
  />
</template>
