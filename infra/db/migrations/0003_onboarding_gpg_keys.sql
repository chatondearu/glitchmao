DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gpg_key_status') THEN
    CREATE TYPE gpg_key_status AS ENUM ('active', 'compromised');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gpg_compromise_reason') THEN
    CREATE TYPE gpg_compromise_reason AS ENUM ('user_report', 'suspected_leak', 'other');
  END IF;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_version VARCHAR(32) NOT NULL DEFAULT 'v1';

CREATE TABLE IF NOT EXISTS gpg_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  fingerprint VARCHAR(120) NOT NULL UNIQUE,
  key_id VARCHAR(32),
  algorithm VARCHAR(32),
  status gpg_key_status NOT NULL DEFAULT 'active',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gpg_key_compromise_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpg_key_id UUID NOT NULL REFERENCES gpg_keys (id) ON DELETE CASCADE,
  reason gpg_compromise_reason NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE signatures
  ADD COLUMN IF NOT EXISTS signing_key_id UUID REFERENCES gpg_keys (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signing_key_fingerprint VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_gpg_keys_user_id ON gpg_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_gpg_keys_user_default ON gpg_keys (user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_gpg_compromise_key_id ON gpg_key_compromise_events (gpg_key_id);

INSERT INTO gpg_keys (user_id, fingerprint, status, is_default)
SELECT p.user_id, p.key_fingerprint, 'active', TRUE
FROM profiles p
WHERE p.key_fingerprint IS NOT NULL
ON CONFLICT (fingerprint) DO NOTHING;
