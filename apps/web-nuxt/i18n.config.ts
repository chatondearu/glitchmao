export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'fr',
  messages: {
    fr: {
      nav: {
        verify: 'Verifier',
        create: 'Creer',
        signatures: 'Signatures',
        profile: 'Profil',
        settings: 'Parametres',
        logout: 'Deconnexion',
        language: 'Langue',
        themeDark: 'Mode sombre',
        themeLight: 'Mode clair',
      },
    },
    en: {
      nav: {
        verify: 'Verify',
        create: 'Create',
        signatures: 'Signatures',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
        language: 'Language',
        themeDark: 'Dark mode',
        themeLight: 'Light mode',
      },
    },
  },
}))
