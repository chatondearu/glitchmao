ALTER TABLE signatures
  ADD COLUMN IF NOT EXISTS public_id VARCHAR(24);

UPDATE signatures
SET public_id = CONCAT(
  FLOOR(EXTRACT(EPOCH FROM COALESCE(created_at, NOW())) * 1000)::BIGINT::TEXT,
  RIGHT(content_hash, 4),
  RIGHT(REPLACE(id::TEXT, '-', ''), 2)
)
WHERE public_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_signatures_public_id ON signatures (public_id);
CREATE INDEX IF NOT EXISTS idx_signatures_public_id ON signatures (public_id);

ALTER TABLE signatures
  ALTER COLUMN public_id SET NOT NULL;
