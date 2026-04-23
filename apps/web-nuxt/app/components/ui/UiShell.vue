<script setup lang="ts">
interface Props {
  reserveBottomInset?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  reserveBottomInset: false,
})
</script>

<template>
  <div class="ui-shell ui-tech-background">
    <header v-if="$slots.header" class="ui-shell-header">
      <slot name="header" />
    </header>
    <main class="ui-shell-main" :class="props.reserveBottomInset ? 'pb-[3.25rem] md:pb-0' : ''">
      <slot />
    </main>
    <footer
      v-if="$slots.footer"
      class="ui-shell-footer"
      :class="props.reserveBottomInset ? 'pb-[3.25rem] md:pb-0' : ''"
    >
      <slot name="footer" />
    </footer>
  </div>
</template>
