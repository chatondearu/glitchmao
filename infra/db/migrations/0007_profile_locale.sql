ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "locale" varchar(8) NOT NULL DEFAULT 'fr';
