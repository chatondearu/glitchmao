# GlitchMao

[Version](https://github.com/chatondearu/glitchmao/releases)
[Release Date](https://github.com/chatondearu/glitchmao/releases)
[CI](https://github.com/chatondearu/glitchmao/actions/workflows/release.yml)
[License](./LICENSE)

GlitchMao is an open-source authenticity toolkit built to make trust portable across the web and beyond.
It links creator identity to digital or physical content through SHA-256 fingerprints and cryptographic signatures, with a verification flow designed for real-world usage.

**Proof for content. Confidence for people.**

The core ideas behind the project are:

- creation should stay simple for creators,
- verification should remain independent for third parties,
- trust should be auditable over time.

GlitchMao combines a Nuxt web app, a dedicated Rust signer service, and persistent history so signatures are not only generated, but also traceable, reviewable, and reusable.

License: MIT

Full documentation: [doc/README.md](doc/README.md)

## Why GlitchMao?

- **Creator-first signing**: produce signatures from text, files, and media workflows without forcing complex crypto steps on end users.
- **Independent verification**: verify through web links, API, or CLI so trust does not depend on a single interface.
- **Audit-ready trust trail**: keep signature metadata and key lifecycle history to support long-term traceability.

## Signature flow

```text
Create content -> Hash (SHA-256) -> Sign (Rust signer + GPG key) -> Store proof -> Verify (ID, hash, or file)
```

## Stack

- Rust workspace for hashing/signing engine, CLI, and internal signer service.
- Nuxt 4 for web UI and verification API routes.
- Reka UI for accessible Vue primitives in the Nuxt app.
- UnoCSS for utility-first styling in the Nuxt app.
- PostgreSQL for signature history.
- Docker and Nix for reproducible development environment.

## Repository layout

- `crates/crypto-core`: core Rust library (`sha256`, GPG signer, bundle type).
- `crates/cli`: CLI for hash/sign/bundle.
- `crates/signer-service`: internal Rust HTTP service used by web API to generate signatures.
- `apps/web-nuxt/app`: Nuxt 4 application directory (`app.vue`, `pages/`, etc.).
- `apps/web-nuxt/server`: Nuxt server directory (`/api/verify`, `/api/signatures`, utils).
- `apps/web-nuxt/app/components/ui`: shared UI components built on top of Reka UI + UnoCSS.
- `infra/db/migrations`: SQL migrations.
- `infra/docker`: development Dockerfile.

## Prerequisites

- Nix with flakes enabled.
- Docker + Docker Compose.
- A local GPG keypair for signing and verification.

## Development workflow

1. Enter the reproducible shell:
  ```bash
   nix develop
  ```
2. Install Nuxt dependencies:
  ```bash
   npm install --prefix apps/web-nuxt
  ```
3. Configure environment:
  ```bash
   cp .env.example .env
  ```
4. Start the stack with Docker (dev mode):
  ```bash
   docker compose -f docker-compose.dev.yml up --build
  ```

## Docker Compose environments

- `docker-compose.yml` (default): production-like runtime (`build + preview`).
- `docker-compose.dev.yml`: development runtime with bind mounts and Nuxt dev server.
- `docker-compose.test.yml`: test runtime with dedicated Postgres DB and CI-style app checks (`test + build`).
- All stacks include a dedicated Rust signer service (`signer-service`) used by the web API for signature generation.

Service topology:

- `web`: Nuxt app and API.
- `signer`: Rust internal HTTP signer (`/sign`, `/health`).
- `postgres`: persistence for profiles, signatures, and key metadata.

### Start production-like stack

```bash
docker compose up --build
```

### Start development stack

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Run test stack

```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from web-test
```

### Stop and cleanup (any stack)

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.test.yml down -v
docker compose down -v
```

## Web UI conventions (Nuxt)

- Use `reka-ui` primitives as the base for accessible interactive components.
- Use UnoCSS utility classes for styling (`@unocss/nuxt` + `uno.config.ts`).
- Keep reusable UI building blocks under `apps/web-nuxt/app/components/ui`.
- Prefer typed props (`<script setup lang="ts">`) and explicit emits for UI components.
- Keep code comments in English and only for non-obvious behavior.

### UI setup references

- Nuxt modules are declared in `apps/web-nuxt/nuxt.config.ts`:
  - `@unocss/nuxt`
  - `reka-ui/nuxt`
  - `@nuxtjs/i18n`
- UnoCSS presets are configured in `apps/web-nuxt/uno.config.ts`.

### Localization policy (Nuxt i18n)

- Locales supported in the web app: French (`fr`) and English (`en`).
- Do not hardcode user-facing strings in components/pages.
- Use key-based translations with `t('...')`.
- Prefer local page-level translations with `<i18n lang="json">` for page-specific copy.
- Keep shared/global navigation and cross-page labels in `apps/web-nuxt/i18n.config.ts`.
- When adding or changing UI content, update both `fr` and `en` translations in the same change.

### Design token checklist (UnoCSS)

Use this checklist before introducing or updating UI primitives.

- `colors.brand.*` scale exists in `apps/web-nuxt/uno.config.ts`.
- Add semantic colors (example: `surface`, `text`, `success`, `warning`, `danger`) mapped to stable hex values.
- Add spacing tokens beyond defaults only when repeated layout patterns appear (avoid premature customization).
- Add radius tokens (`sm`, `md`, `lg`, `xl`) and use them consistently across `app/components/ui`.
- Add typography tokens for app-level consistency (font sizes/line heights for `body`, `label`, `caption`, `title`).
- Add shadow tokens for elevation levels (`sm`, `md`, `lg`) and limit usage to key interactive surfaces.
- Add motion tokens (duration/easing) for interactive components (hover, focus, open/close).
- Define and document interaction state tokens (`hover`, `focus`, `disabled`, `error`) for form controls and buttons.
- Ensure color contrast is accessible (WCAG AA minimum) for text and actionable controls.
- Keep token naming semantic and stable; avoid naming by raw color intent like `blue-button`.
- When a new token is introduced, update this README section and apply it in at least one shared UI component.

Recommended incremental process:

1. Identify repetition in a real component/page.
2. Introduce the smallest useful token in `uno.config.ts`.
3. Apply it to shared components under `app/components/ui`.
4. Validate visual consistency and accessibility.
5. Document the change in this checklist.

## Rust CLI usage

From the repository root:

```bash
nix develop -c cargo run -p glitchmao-cli -- hash --text "hello"
```

```bash
nix develop -c cargo run -p glitchmao-cli -- sign-text --text "hello" --key-id "$GPG_KEY_ID"
```

```bash
nix develop -c cargo run -p glitchmao-cli -- bundle --text "hello" --key-id "$GPG_KEY_ID" --verification-url "$VERIFICATION_BASE_URL?h=<HASH>"
```

## API endpoints

- `GET /api/verify?hash=<sha256>`: verify a known hash against stored signature.
- `POST /api/verify` with multipart `file`: hash uploaded file then verify.
- `POST /api/signatures`: store a signature record.
- `GET /api/onboarding/state`: onboarding gate state (profile/key readiness).
- `POST /api/onboarding/complete`: complete onboarding and generate a default key.
- `GET /api/settings/gpg-keys`: list keys and active default status.
- `POST /api/settings/gpg-keys/default`: switch default signing key.
- `POST /api/settings/gpg-keys/:id/compromise`: mark a key as compromised (no deletion).

## Onboarding and key management

- On first access, onboarding is required when no profile exists or no active default GPG key is available.
- Onboarding includes project explanation slides and profile setup.
- A default GPG key is generated automatically during onboarding.
- Keys are managed through Settings:
  - set default key,
  - mark key as compromised,
  - no key deletion from UI/API.

### Signing key source and fallback behavior

- Target behavior: signatures are generated with the current user's active default key managed through onboarding/settings.
- `GPG_KEY_ID` is currently kept as a compatibility/bootstrap fallback for legacy and startup edge cases.
- Long-term direction: remove fallback usage and require an active user key for every signature operation.

## Generate a test GPG key

```bash
gpg --quick-generate-key "GlitchMao Test <test@glitchmao.local>" ed25519 sign 1y
```

Set `GPG_KEY_ID` in `.env` to the generated key ID or email.

### Environment variables used

- `DATABASE_URL`
- `SIGNER_SECURITY_MODE`
- `SIGNER_JWT_SECRET`
- `SIGNER_JWT_TTL_SEC`
- `SIGNER_INSECURE_BIND`
- `GPG_KEY_ID` (compatibility/bootstrap fallback; not the primary key source after onboarding)
- `GPG_HOME`
- `GPG_DEFAULT_KEY_NAME`
- `GPG_DEFAULT_KEY_DOMAIN`
- `SIGNER_SERVICE_URL`
- `VERIFICATION_BASE_URL`
- `STORAGE_PROVIDER`
- `STORAGE_BUCKET`
- `STORAGE_BASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `PASSWORD_RESET_BASE_URL`

For complete env documentation and Docker-specific overlays, see [doc/configuration.md](doc/configuration.md).

## Conventional Commits

Use Conventional Commits for every commit:

- `feat(scope): ...`
- `fix(scope): ...`
- `docs(scope): ...`
- `chore(scope): ...`

