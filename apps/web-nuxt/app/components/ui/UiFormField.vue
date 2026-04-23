<script setup lang="ts">
import { computed, provide, useId } from 'vue'

interface Props {
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  error: '',
})

const fieldErrorId = `ui-field-error-${useId()}`

const formFieldInvalid = computed(() => Boolean(props.error))
const formFieldDescribedBy = computed(() => props.error ? fieldErrorId : undefined)

provide('ui-form-field-invalid', formFieldInvalid)
provide('ui-form-field-describedby', formFieldDescribedBy)
</script>

<template>
  <div class="grid gap-1.5">
    <slot />
    <p
      v-if="props.error"
      :id="fieldErrorId"
      class="text-label-mono text-error uppercase"
      role="alert"
    >
      {{ props.error }}
    </p>
  </div>
</template>
