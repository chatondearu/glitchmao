# Self-hosting GlitchMao

This guide explains how to run GlitchMao with Docker Compose for local development and self-hosted environments.

## Prerequisites

- Docker and Docker Compose
- Nix (recommended for local tooling consistency)

## Environment variables

GlitchMao runtime variables are documented in the dedicated reference:

- [Configuration reference](./configuration.md)

Important security variables for app -> signer communication:

- `SIGNER_SECURITY_MODE=secure|insecure_local`
- `SIGNER_JWT_SECRET`
- `SIGNER_JWT_TTL_SEC`
- `SIGNER_INSECURE_BIND`

Important email variables for password reset:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `PASSWORD_RESET_BASE_URL`

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
- `web-migrations` watches `infra/db/migrations/*.sql` and reapplies SQL migrations automatically

### Production-like stack

```bash
docker compose up --build
```

Services:

- `web` runs `build + preview` mode
- `signer` runs in release mode
- `postgres` persists data in `pg_data_prod`
- `web` and `signer` have healthchecks and `restart: unless-stopped` for container platforms

### Coolify notes

When deploying `docker-compose.yml` on Coolify:

- set `VERIFICATION_BASE_URL` and `PASSWORD_RESET_BASE_URL` to your public app URL,
- set a strong `SIGNER_JWT_SECRET`,
- keep `SIGNER_SERVICE_URL=http://signer:4000` (service-to-service network),
- do not expose `postgres` externally unless you need direct database access.

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
- In `secure` mode, signer requests are authorized with short-lived JWT delegation from the web API.
- `insecure_local` mode is intended for standalone local CLI usage only and must bind to localhost.
