<script setup lang="ts">
import { computed, inject, type ComputedRef } from 'vue'

interface Props {
  modelValue: string
  disabled?: boolean
  name?: string
  id?: string
  ariaInvalid?: boolean
  ariaDescribedby?: string
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

const injectedInvalid = inject<ComputedRef<boolean>>('ui-form-field-invalid', computed(() => false))
const injectedDescribedBy = inject<ComputedRef<string | undefined>>('ui-form-field-describedby', computed(() => undefined))

const ariaInvalid = computed(() => props.ariaInvalid ?? (injectedInvalid.value || undefined))
const ariaDescribedBy = computed(() => props.ariaDescribedby ?? injectedDescribedBy.value)

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
    :aria-invalid="ariaInvalid"
    :aria-describedby="ariaDescribedBy"
    class="ui-input-base h-10"
    @change="onChange"
  >
    <slot />
  </select>
</template>
