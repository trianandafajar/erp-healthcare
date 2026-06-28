CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-cleanup expired tokens (optional, jalankan via cron atau manual)
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_tokens_email ON password_reset_tokens(email);

ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;
GRANT ALL ON password_reset_tokens TO anon, authenticated, service_role;