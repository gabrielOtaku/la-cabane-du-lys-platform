-- ============================================================
--  V3 — Recherche plein texte (épisodes) + compteurs sociaux
-- ============================================================

-- Vecteur de recherche généré (titre + description + invité + transcription)
ALTER TABLE episodes
    ADD COLUMN search_vec tsvector
        GENERATED ALWAYS AS (
            to_tsvector('french',
                coalesce(title,           '') || ' ' ||
                coalesce(description,     '') || ' ' ||
                coalesce(guest_name,      '') || ' ' ||
                coalesce(transcript_json, ''))
        ) STORED;

CREATE INDEX idx_episodes_search ON episodes USING GIN (search_vec);

-- Compteurs sociaux (clé/valeur simple — mis à jour par le cron §6.2)
CREATE TABLE social_stats (
    key        VARCHAR(60) PRIMARY KEY,
    value      BIGINT      NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO social_stats (key, value) VALUES
    ('listeners_total',  4800),
    ('downloads_total',  31200),
    ('reviews_total',    312),
    ('spotify_followers', 2100);
