<template>
  <div class="ui-shell ui-tech-background">
    <header v-if="$slots.header" class="ui-shell-header">
      <slot name="header" />
    </header>
    <main class="ui-shell-main">
      <slot />
    </main>
    <footer v-if="$slots.footer" class="ui-shell-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>
