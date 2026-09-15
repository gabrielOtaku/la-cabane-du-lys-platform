-- ============================================================
--  V7 — Journal d'audit du back office (feuille de route 2026-09, phase 7)
--  Chaque action administrative sensible laisse une trace exploitable.
-- ============================================================

CREATE TABLE audit_events (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_email VARCHAR(255) NOT NULL,
    action      VARCHAR(80)  NOT NULL,
    target_type VARCHAR(40)  NOT NULL,
    target_id   VARCHAR(80),
    details     VARCHAR(1000),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_events_created ON audit_events(created_at DESC);
CREATE INDEX idx_audit_events_target  ON audit_events(target_type, target_id);
