-- ============================================================================
-- MODULE 00: EXTENSIONS & COMMON HELPERS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- fuzzy/partial text search
CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- gen_random_uuid()

-- Global updated_at timestamp auto-update trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
