<template>
  <header class="border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-sm">
    <div class="ui-container flex min-h-12 flex-wrap items-center gap-2 py-2 md:flex-nowrap md:justify-between">
      <div class="min-w-0 shrink-0">
        <slot name="brand" />
      </div>
      <div v-if="$slots.status" class="ml-auto shrink-0">
        <slot name="status" />
      </div>
      <div class="w-full min-w-0 md:w-auto md:flex-1">
        <slot name="content" />
      </div>
    </div>
  </header>
</template>
