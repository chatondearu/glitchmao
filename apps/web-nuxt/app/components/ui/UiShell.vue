<template>
  <div class="ui-shell ui-tech-background">
    <header v-if="$slots.header" class="ui-shell-header">
      <slot name="header" />
    </header>
    <main class="ui-shell-main pb-[3.25rem] md:pb-0">
      <slot />
    </main>
    <footer v-if="$slots.footer" class="ui-shell-footer pb-[3.25rem] md:pb-0">
      <slot name="footer" />
    </footer>
  </div>
</template>
