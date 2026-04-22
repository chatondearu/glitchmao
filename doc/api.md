# API Reference

Base URL examples:

- local dev: `http://localhost:3000`
- production-like: your public domain

## Verification

### `GET /api/verify`

Verify a signature by public ID (preferred) or by SHA-256 hash.

Query params:

- `id` (optional): public signature ID (or UUID fallback)
- `hash` (optional): content SHA-256 hash

At least one of `id` or `hash` is required.

Example:

```bash
curl "http://localhost:3000/api/verify?id=1713880000000ab12"
```

Response:

```json
{
  "status": "AUTHENTIQUE",
  "details": "Hash and signature are valid"
}
```

### `POST /api/verify`

Verify by uploading a file (`multipart/form-data` with field `file`).

```bash
curl -X POST "http://localhost:3000/api/verify" \
  -F "file=@./example.pdf"
```

## Signatures

### `POST /api/signatures`

Create a signature record from a hash.
If the hash already exists, the API returns the existing signature (`status: "already_exists"`).

Security behavior:

- Requires authenticated session.
- Uses active profile/signing context resolved server-side.
- Owner fields are no longer accepted from client payload.

Request body:

- `content_hash` (required, 64 hex chars)
- `creator_id` (optional)
- `source_type` (optional): `image|pdf|text|markdown|plain_text`
- `content_mime_type` (optional)
- `verification_url` (optional, absolute URL)
- `status` (optional): `AUTHENTIQUE|CORROMPU/INCONNU`
- `storage_provider` (optional): `none|s3|custom`
- `storage_object_url` (optional URL)

Example:

```bash
curl -X POST "http://localhost:3000/api/signatures" \
  -H "Content-Type: application/json" \
  -d '{
    "content_hash": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    "source_type": "plain_text"
  }'
```

Response (new record):

```json
{
  "id": "1713880000000b9824",
  "internal_id": "0d7e11b2-38cf-4d22-bf4e-5f5ddf1ac9d1",
  "status": "stored",
  "verification_url": "http://localhost:3000/verify?id=1713880000000b9824"
}
```

Response (already exists):

```json
{
  "id": "1713880000000b9824",
  "internal_id": "0d7e11b2-38cf-4d22-bf4e-5f5ddf1ac9d1",
  "status": "already_exists",
  "verification_url": "http://localhost:3000/verify?id=1713880000000b9824"
}
```

### `GET /api/signatures`

List signatures with filters and cursor pagination.

Query params:

- `source_type` (optional)
- `profile_id` (optional UUID)
- `from` / `to` (optional ISO datetime)
- `cursor` (optional opaque cursor)
- `limit` (optional, default `25`, max `100`)

## Profile endpoints

- `GET /api/profile`: current profile
- `POST /api/profile`: create profile for authenticated user
- `PUT /api/profile`: update current profile
- `GET /api/profiles`: list profiles for the authenticated user

## Onboarding endpoints

- `GET /api/onboarding/state`: onboarding readiness state
- `POST /api/onboarding/complete`: complete onboarding, create/update profile, generate and set default signing key

## Authentication endpoints

- `POST /api/auth/register`: create account with password
- `POST /api/auth/login`: sign in with handle/password
- `POST /api/auth/logout`: sign out current session
- `GET /api/auth/me`: current auth/session/profile summary
- `POST /api/auth/switch-profile`: set active profile in session
- `POST /api/auth/set-password`: set password for legacy authenticated account
- `POST /api/auth/forgot-password/request`: request reset email by handle/email
- `POST /api/auth/forgot-password/reset`: reset password using one-time token

## GPG key settings endpoints

- `GET /api/settings/gpg-keys`: list keys for current profile user
- `POST /api/settings/gpg-keys/default`: set default key (payload: `key_id`)
- `POST /api/settings/gpg-keys/:id/compromise`: mark key as compromised
