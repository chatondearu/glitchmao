# Configuration Reference

This page documents runtime environment variables used by GlitchMao.
Set values in `.env` for local runs, and in your deployment secret manager for production.

## Core app

- `DATABASE_URL`: database URL used by the Nuxt server (host runtime).
- `VERIFICATION_BASE_URL`: public verification base URL used to build signature links.
- `SIGNER_SERVICE_URL`: URL used by Nuxt server to call the Rust signer service.

## Signer security (app -> signer)

- `SIGNER_SECURITY_MODE`: `secure` or `insecure_local`.
  - `secure` (default): requires signed JWT delegation.
  - `insecure_local`: local CLI-only mode, guarded to localhost bind.
- `SIGNER_JWT_SECRET`: shared HMAC secret used by Nuxt to issue short-lived signer tokens and by signer to verify them.
- `SIGNER_JWT_TTL_SEC`: signer delegation token lifetime in seconds (recommended: `30-60`).
- `SIGNER_INSECURE_BIND`: required local bind in `insecure_local` mode (default `127.0.0.1`).

## GPG and key defaults

- `GPG_KEY_ID`: compatibility/bootstrap fallback key ID.
- `GPG_DEFAULT_KEY_NAME`: default user name used for onboarding key generation.
- `GPG_DEFAULT_KEY_DOMAIN`: default email domain for generated keys.
- `SIGNER_DEFAULT_KEY_ID`: signer fallback key ID (used in local/insecure flows).
- `SIGNER_HOST`: signer listen host.
- `SIGNER_PORT`: signer listen port.
- `GNUPGHOME_DOCKER`: keyring path used in Docker signer containers.

## Storage

- `STORAGE_PROVIDER`: `none`, `s3`, or `custom`.
- `STORAGE_BUCKET`: storage bucket name (when applicable).
- `STORAGE_BASE_URL`: storage base URL (when applicable).

## SMTP / password reset

- `SMTP_HOST`: SMTP server host (`smtp.fastmail.com` for Fastmail).
- `SMTP_PORT`: SMTP server port (`465` for implicit TLS, `587` for STARTTLS).
- `SMTP_SECURE`: `true` for implicit TLS (port 465), `false` for STARTTLS/plain handshake.
- `SMTP_USER`: SMTP account username.
- `SMTP_PASS`: SMTP app password/credential.
- `SMTP_FROM`: sender email used for reset notifications.
- `PASSWORD_RESET_BASE_URL`: public URL prefix for password reset links.

## Docker/Compose-specific variables

The repository exposes dedicated variables to avoid host/container URL confusion:

- `DATABASE_URL_DOCKER`
- `DATABASE_URL_DOCKER_DEV`
- `DATABASE_URL_DOCKER_PROD`
- `DATABASE_URL_DOCKER_TEST`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_DB_TEST`
- `CHOKIDAR_USEPOLLING`
- `NPM_CONFIG_CACHE_DOCKER`

All Compose files use `${VAR:-fallback}` so values from `.env` are respected by default.
