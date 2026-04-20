# GlitchMao

GlitchMao is an open-source authenticity toolkit that links creator identity to digital or physical content using SHA-256 hashing and GPG signatures.

## Stack

- Rust workspace for hashing/signing engine and CLI.
- Nuxt 4 for web UI and verification API routes.
- PostgreSQL for signature history.
- Docker and Nix for reproducible development environment.

## Repository layout

- `crates/crypto-core`: core Rust library (`sha256`, GPG signer, bundle type).
- `crates/cli`: CLI for hash/sign/bundle.
- `apps/web-nuxt/app`: Nuxt 4 application directory (`app.vue`, `pages/`, etc.).
- `apps/web-nuxt/server`: Nuxt server directory (`/api/verify`, `/api/signatures`, utils).
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
4. Start the stack with Docker:
  ```bash
   docker compose up --build
  ```

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

## Generate a test GPG key

```bash
gpg --quick-generate-key "GlitchMao Test <test@glitchmao.local>" ed25519 sign 1y
```

Set `GPG_KEY_ID` in `.env` to the generated key ID or email.

## Conventional Commits

Use Conventional Commits for every commit:

- `feat(scope): ...`
- `fix(scope): ...`
- `docs(scope): ...`
- `chore(scope): ...`

