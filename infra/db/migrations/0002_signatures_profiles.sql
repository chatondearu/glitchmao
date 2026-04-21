DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signature_status') THEN
    CREATE TYPE signature_status AS ENUM ('AUTHENTIQUE', 'CORROMPU/INCONNU');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signature_source_type') THEN
    CREATE TYPE signature_source_type AS ENUM ('image', 'pdf', 'text', 'markdown', 'plain_text');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'storage_provider') THEN
    CREATE TYPE storage_provider AS ENUM ('none', 's3', 'custom');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle VARCHAR(80) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  key_fingerprint VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE signatures
  ALTER COLUMN status TYPE signature_status USING status::signature_status;

ALTER TABLE signatures
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_type signature_source_type NOT NULL DEFAULT 'plain_text',
  ADD COLUMN IF NOT EXISTS content_mime_type VARCHAR(120),
  ADD COLUMN IF NOT EXISTS storage_provider storage_provider NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS storage_object_url TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_signatures_profile_created_at ON signatures (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signatures_source_created_at ON signatures (source_type, created_at DESC);
