# Self-hosting GlitchMao

This guide explains how to run GlitchMao with Docker Compose for local development and self-hosted environments.

## Prerequisites

- Docker and Docker Compose
- Nix (recommended for local tooling consistency)

## Environment variables

The web app reads runtime settings from environment variables:

- `DATABASE_URL`
- `GPG_KEY_ID` (compatibility/bootstrap fallback)
- `GPG_DEFAULT_KEY_NAME`
- `GPG_DEFAULT_KEY_DOMAIN`
- `SIGNER_SERVICE_URL`
- `VERIFICATION_BASE_URL`
- `STORAGE_PROVIDER`
- `STORAGE_BUCKET`
- `STORAGE_BASE_URL`

Copy the example file before starting local runs:

```bash
cp .env.example .env
```

## Compose profiles

### Development stack

```bash
docker compose -f docker-compose.dev.yml up --build
```

Services:

- `web`: Nuxt dev server on port `3000`
- `signer`: Rust signer service on internal port `4000`
- `postgres`: PostgreSQL 16 on port `5432`

Startup behavior:

- The web container installs dependencies
- SQL migrations are applied with `npm run db:migrate:sql --prefix apps/web-nuxt`
- Nuxt starts in development mode

### Production-like stack

```bash
docker compose up --build
```

Services:

- `web` runs `build + preview` mode
- `signer` runs in release mode
- `postgres` persists data in `pg_data_prod`

### Test stack

```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from web-test
```

The `web-test` service runs:

1. `db:migrate:sql`
2. `npm test` (`apps/web-nuxt`)
3. `npm run build` (`apps/web-nuxt`)

## Operational notes

- GPG private key material is isolated in the signer container volume (`/gnupg`).
- The web service never mounts signer keyring storage.
- `SIGNER_SERVICE_URL` should target the signer service endpoint reachable from `web`.
- `VERIFICATION_BASE_URL` should be set to your public URL in self-hosted production.
