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
    class="ui-input-base file:mr-3 file:border-0 file:bg-primary-container file:px-3 file:py-1 file:text-xs file:font-semibold file:uppercase file:tracking-[0.08em] file:text-on-primary hover:file:opacity-85"
    @change="onChange"
  >
</template>
