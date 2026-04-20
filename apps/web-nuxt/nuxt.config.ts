export default defineNuxtConfig({
  compatibilityDate: '2026-04-20',
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ?? '',
    gpgKeyId: process.env.GPG_KEY_ID ?? '',
    verificationBaseUrl: process.env.VERIFICATION_BASE_URL ?? 'http://localhost:3000/verify',
  },
})
