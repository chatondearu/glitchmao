<script setup lang="ts">
const route = useRoute()
const navItems = [
  { to: '/', label: 'Verifier' },
  { to: '/signatures/new', label: 'Creer' },
  { to: '/signatures', label: 'Signatures' },
  { to: '/profile', label: 'Profil' },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <NuxtLink to="/" class="text-lg font-semibold text-slate-900">
          GlitchMao
        </NuxtLink>
        <nav class="flex flex-wrap items-center gap-2">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-md px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
            :class="route.path === item.to ? 'bg-slate-200 text-slate-900' : 'text-slate-700'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <slot />
  </div>
</template>
