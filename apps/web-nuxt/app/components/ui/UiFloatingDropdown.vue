<script setup lang="ts">
import type { Placement } from '@floating-ui/dom'
import { autoUpdate, flip, offset, shift } from '@floating-ui/dom'
import { useFloating } from '@floating-ui/vue'

interface Props {
  placement?: Placement
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'bottom-end',
  zIndex: 50,
})

defineSlots<{
  trigger: (props: { open: boolean, toggle: () => void }) => unknown
  default: (props: { close: () => void }) => unknown
}>()

const open = ref(false)
const referenceRef = ref<HTMLElement | null>(null)
const floatingRef = ref<HTMLElement | null>(null)
const lastFocusedElement = ref<HTMLElement | null>(null)

const { floatingStyles } = useFloating(referenceRef, floatingRef, {
  open,
  placement: () => props.placement,
  middleware: [
    offset(8),
    flip(),
    shift({ padding: 8 }),
  ],
  whileElementsMounted: autoUpdate,
})

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onPointerDownOutside(event: MouseEvent | PointerEvent) {
  const target = event.target as Node | null
  if (!target)
    return
  if (referenceRef.value?.contains(target))
    return
  if (floatingRef.value?.contains(target))
    return
  close()
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape')
    close()
}

function focusFirstMenuItem() {
  const firstFocusableItem = floatingRef.value?.querySelector<HTMLElement>(
    '[role="menuitem"], button:not([disabled]), a[href], select, input, [tabindex]:not([tabindex="-1"])',
  )
  firstFocusableItem?.focus()
}

watch(open, (isOpen) => {
  if (!import.meta.client)
    return
  if (isOpen) {
    lastFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
    queueMicrotask(() => {
      document.addEventListener('pointerdown', onPointerDownOutside, true)
    })
    document.addEventListener('keydown', onGlobalKeydown)
    queueMicrotask(() => {
      focusFirstMenuItem()
    })
  }
  else {
    document.removeEventListener('pointerdown', onPointerDownOutside, true)
    document.removeEventListener('keydown', onGlobalKeydown)
    lastFocusedElement.value?.focus()
    lastFocusedElement.value = null
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client)
    return
  document.removeEventListener('pointerdown', onPointerDownOutside, true)
  document.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div class="inline-flex">
    <div
      ref="referenceRef"
      class="inline-flex"
    >
      <slot
        name="trigger"
        :open="open"
        :toggle="toggle"
      />
    </div>
    <Teleport to="body">
      <div
        v-if="open"
        ref="floatingRef"
        class="border-2 border-outline-variant bg-surface-container-low py-2 shadow-none outline-none"
        :style="{ ...floatingStyles, zIndex: props.zIndex }"
        role="menu"
      >
        <slot
          name="default"
          :close="close"
        />
      </div>
    </Teleport>
  </div>
</template>
