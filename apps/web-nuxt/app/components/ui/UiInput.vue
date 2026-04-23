<script setup lang="ts">
import { computed, inject, type ComputedRef } from 'vue'

type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'url'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'number'
  | 'tel'

interface Props {
  id?: string
  name?: string
  type?: InputType
  placeholder?: string
  required?: boolean
  disabled?: boolean
  modelValue?: string
  ariaInvalid?: boolean
  ariaDescribedby?: string
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

const injectedInvalid = inject<ComputedRef<boolean>>('ui-form-field-invalid', computed(() => false))
const injectedDescribedBy = inject<ComputedRef<string | undefined>>('ui-form-field-describedby', computed(() => undefined))

const ariaInvalid = computed(() => props.ariaInvalid ?? (injectedInvalid.value || undefined))
const ariaDescribedBy = computed(() => props.ariaDescribedby ?? injectedDescribedBy.value)

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
    :aria-invalid="ariaInvalid"
    :aria-describedby="ariaDescribedBy"
    class="ui-input-base placeholder:text-on-surface-variant/70"
    @input="onInput"
  >
</template>
