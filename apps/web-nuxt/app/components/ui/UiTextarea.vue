<script setup lang="ts">
import { computed, inject, type ComputedRef } from 'vue'

interface Props {
  id?: string
  name?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  modelValue?: string
  ariaInvalid?: boolean
  ariaDescribedby?: string
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

const injectedInvalid = inject<ComputedRef<boolean>>('ui-form-field-invalid', computed(() => false))
const injectedDescribedBy = inject<ComputedRef<string | undefined>>('ui-form-field-describedby', computed(() => undefined))

const ariaInvalid = computed(() => props.ariaInvalid ?? (injectedInvalid.value || undefined))
const ariaDescribedBy = computed(() => props.ariaDescribedby ?? injectedDescribedBy.value)

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
    :aria-invalid="ariaInvalid"
    :aria-describedby="ariaDescribedBy"
    class="ui-input-base placeholder:text-on-surface-variant/70"
    @input="onInput"
  />
</template>
