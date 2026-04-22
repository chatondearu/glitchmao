<script setup lang="ts">
interface Props {
  id?: string
  name?: string
  accept?: string
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: '',
  required: false,
  disabled: false,
  name: undefined,
  id: undefined,
})

const emit = defineEmits<{
  change: [file: File | null, event: Event]
}>()

function onChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0] ?? null
  emit('change', file, event)
}
</script>

<template>
  <input
    :id="props.id"
    :name="props.name"
    type="file"
    :accept="props.accept"
    :required="props.required"
    :disabled="props.disabled"
    class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
    @change="onChange"
  >
</template>
