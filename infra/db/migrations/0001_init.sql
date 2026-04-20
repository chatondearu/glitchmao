CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash CHAR(64) NOT NULL,
  signature TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  verification_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AUTHENTIQUE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verification_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_signatures_content_hash ON signatures (content_hash);
CREATE INDEX IF NOT EXISTS idx_signatures_created_at ON signatures (created_at DESC);
