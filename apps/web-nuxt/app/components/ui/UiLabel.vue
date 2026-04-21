<script setup lang="ts">
import { Label } from 'reka-ui'

interface Props {
  for?: string
}

const props = defineProps<Props>()
</script>

<template>
  <Label
    :for="props.for"
    class="text-sm font-medium text-slate-800"
  >
    <slot />
  </Label>
</template>
