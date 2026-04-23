<script setup lang="ts">
interface TopbarNavItem {
  to: string
  label: string
  match?: 'exact' | 'prefix'
}

interface Props {
  navItems?: TopbarNavItem[]
}

const props = withDefaults(defineProps<Props>(), {
  navItems: () => [],
})

const route = useRoute()

function isNavItemActive(item: TopbarNavItem) {
  const mode = item.match ?? 'exact'
  if (mode === 'prefix')
    return route.path.startsWith(item.to)
  return route.path === item.to
}
</script>

<template>
  <header class="border-b border-outline-variant bg-surface-container-lowest/95 text-primary-container backdrop-blur-sm">
    <div class="ui-container flex h-12 items-center justify-between gap-3">
      <div class="min-w-0 shrink-0">
        <slot name="brand" />
      </div>
      <nav v-if="$slots.nav || props.navItems.length" class="hidden h-full items-center gap-1 md:flex">
        <slot name="nav">
          <NuxtLink
            v-for="item in props.navItems"
            :key="item.to"
            :to="item.to"
            :aria-current="isNavItemActive(item) ? 'page' : undefined"
            class="flex h-full items-center whitespace-nowrap border-b-2 border-transparent px-2 font-tech text-[11px] uppercase tracking-[0.12em] text-on-surface-variant transition-colors hover:bg-primary-container/10 hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
            :class="isNavItemActive(item) ? '!border-primary-container text-primary-container' : ''"
          >
            {{ item.label }}
          </NuxtLink>
        </slot>
      </nav>
      <div v-if="$slots.actions" class="ml-auto flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
