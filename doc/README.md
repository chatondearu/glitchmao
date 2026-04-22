# GlitchMao Documentation

GlitchMao links creator identity to content integrity with SHA-256 hashing and GPG signatures.
This documentation focuses on operating the stack and integrating with its public interfaces.

## Documentation map

- [Self-hosting guide](./self-hosting.md): run GlitchMao in development, production-like mode, and test mode.
- [Configuration reference](./configuration.md): environment variables for app, signer security, SMTP, and compose overlays.
- [API reference](./api.md): web API endpoints, payloads, and examples.
- [CLI reference](./cli.md): `glitchmao` command usage and examples.

## Product model

GlitchMao separates responsibilities between services:

- `web` (Nuxt): UI + API orchestration + database persistence.
- `signer` (Rust service): signature and key generation/verification operations.
- `postgres`: persistence for signatures, profiles, and key metadata.

This split keeps cryptographic material in the signer service while preserving application-level auditability in PostgreSQL.

## Localization and UI content

The Nuxt web app uses `@nuxtjs/i18n` with two locales:

- `fr` (French)
- `en` (English)

When adding or updating UI content:

- Update both locales in the same change.
- Use translation keys in code (`t('...')`), not hardcoded display strings.
- Keep page-specific text in local `<i18n lang="json">` blocks.
- Keep shared labels (navigation/common/global) in `apps/web-nuxt/i18n.config.ts`.
