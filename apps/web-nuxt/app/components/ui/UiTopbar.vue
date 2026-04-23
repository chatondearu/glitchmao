<script setup lang="ts">
interface TopbarNavItem {
  to: string
  label: string
  icon?: string
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
    <div class="ui-container grid h-12 grid-cols-[auto_1fr_auto] items-center gap-3">
      <div class="min-w-0 shrink-0 justify-self-start">
        <slot name="brand" />
      </div>
      <nav v-if="$slots.nav || props.navItems.length" class="hidden h-full w-full items-center justify-center md:flex">
        <slot name="nav">
          <div class="flex h-full w-full max-w-[34rem] items-center justify-center gap-1">
            <NuxtLink
              v-for="item in props.navItems"
              :key="item.to"
              :to="item.to"
              :aria-current="isNavItemActive(item) ? 'page' : undefined"
              class="inline-flex h-full min-w-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-2 font-tech text-[11px] uppercase tracking-[0.12em] text-on-surface-variant transition-colors hover:bg-primary-container/10 hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
              :class="isNavItemActive(item) ? '!border-primary-container/100 text-primary-container' : 'opacity-90'"
            >
              <span v-if="item.icon" class="h-4 w-4 shrink-0 leading-none opacity-85" :class="[item.icon, isNavItemActive(item) ? 'opacity-100' : '']" aria-hidden="true" />
              <span class="truncate">{{ item.label }}</span>
            </NuxtLink>
          </div>
        </slot>
      </nav>
      <div v-if="$slots.actions" class="ml-auto flex shrink-0 items-center gap-2 justify-self-end">
        <slot name="actions" />
      </div>
    </div>
  </header>
  <nav
    v-if="$slots.nav || props.navItems.length"
    class="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container-lowest/95 backdrop-blur-sm md:hidden"
    aria-label="Mobile primary"
  >
    <slot name="mobile-nav">
      <div class="ui-container grid h-[3.25rem] grid-cols-3 items-stretch pb-[max(env(safe-area-inset-bottom),0px)]">
        <NuxtLink
          v-for="item in props.navItems"
          :key="`mobile-${item.to}`"
          :to="item.to"
          :aria-current="isNavItemActive(item) ? 'page' : undefined"
          class="flex min-w-0 flex-col items-center justify-center gap-0.5 border-t-2 border-transparent px-1 text-[9px] uppercase tracking-[0.08em] text-on-surface-variant transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60"
          :class="isNavItemActive(item) ? 'border-primary-container/100 text-primary-container' : 'opacity-90'"
        >
          <span v-if="item.icon" class="h-[1.1rem] w-[1.1rem] shrink-0 leading-none opacity-85" :class="[item.icon, isNavItemActive(item) ? 'opacity-100' : '']" aria-hidden="true" />
          <span class="truncate">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </slot>
  </nav>
</template>
