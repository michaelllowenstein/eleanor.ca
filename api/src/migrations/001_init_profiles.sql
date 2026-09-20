CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    subject_hash TEXT NOT NULL UNIQUE,
    realtime_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS assistant_profiles (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(40) NOT NULL,
    settings JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT assistant_profiles_name_not_blank CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT assistant_profiles_settings_object CHECK (jsonb_typeof(settings) = 'object')
);
CREATE INDEX IF NOT EXISTS idx_assistant_profiles_user ON assistant_profiles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assistant_profiles_one_active ON assistant_profiles(user_id)
WHERE is_active = TRUE;
CREATE TABLE IF NOT EXISTS assistant_sessions (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES assistant_profiles(id) ON DELETE
    SET NULL,
        provider VARCHAR(32) NOT NULL,
        model VARCHAR(128) NOT NULL,
        status VARCHAR(32) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_user_created ON assistant_sessions(user_id, created_at DESC);