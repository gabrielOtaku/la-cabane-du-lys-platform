-- ============================================================
--  V5 — Lien magique à usage unique (feuille de route 2026-09, phase 1)
--  Seul le hachage SHA-256 du secret est conservé.
-- ============================================================

CREATE TABLE magic_link_tokens (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_magic_link_tokens_email   ON magic_link_tokens(email);
CREATE INDEX idx_magic_link_tokens_expires ON magic_link_tokens(expires_at);
