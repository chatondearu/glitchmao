export default defineNuxtConfig({
  compatibilityDate: '2026-04-20',
  devtools: { enabled: true },
  modules: [
    '@unocss/nuxt',
    'reka-ui/nuxt',
  ],
  typescript: {
    strict: true,
    typeCheck: false,
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ?? '',
    gpgKeyId: process.env.GPG_KEY_ID ?? '',
    gpgHome: process.env.GPG_HOME ?? '',
    gpgDefaultKeyName: process.env.GPG_DEFAULT_KEY_NAME ?? 'GlitchMao User',
    gpgDefaultKeyDomain: process.env.GPG_DEFAULT_KEY_DOMAIN ?? 'glitchmao.local',
    signerServiceUrl: process.env.SIGNER_SERVICE_URL ?? 'http://signer:4000',
    verificationBaseUrl: process.env.VERIFICATION_BASE_URL ?? 'http://localhost:3000/verify',
    storageProvider: process.env.STORAGE_PROVIDER ?? 'none',
    storageBucket: process.env.STORAGE_BUCKET ?? '',
    storageBaseUrl: process.env.STORAGE_BASE_URL ?? '',
  },
})
