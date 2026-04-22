<script setup lang="ts">
const route = useRoute()
const { t } = useI18n({ useScope: 'local' })

const settingsNavItems = [
  { to: '/settings/profile', labelKey: 'subnav.profile' },
  { to: '/settings/preferences', labelKey: 'subnav.preferences' },
]
</script>

<template>
  <main class="ui-container py-8">
    <h1 class="text-headline-md font-semibold">
      {{ t('title') }}
    </h1>
    <p class="mt-2 text-body-md text-on-surface-variant">
      {{ t('subtitle') }}
    </p>
    <nav class="mt-6 flex flex-wrap items-center gap-2 border-b border-outline-variant pb-3">
      <NuxtLink
        v-for="item in settingsNavItems"
        :key="item.to"
        :to="item.to"
        class="inline-flex items-center border border-outline-variant px-3 py-2 text-label-caps transition"
        :class="route.path === item.to ? 'border-primary-container bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'"
      >
        {{ t(item.labelKey) }}
      </NuxtLink>
    </nav>
    <NuxtPage />
  </main>
</template>

<i18n lang="json">
{
  "fr": {
    "title": "Parametres",
    "subtitle": "Gerez votre profil et les parametres de securite.",
    "subnav": {
      "profile": "Profil",
      "preferences": "Parametres"
    }
  },
  "en": {
    "title": "Settings",
    "subtitle": "Manage your profile and security settings.",
    "subnav": {
      "profile": "Profile",
      "preferences": "Preferences"
    }
  }
}
</i18n>
