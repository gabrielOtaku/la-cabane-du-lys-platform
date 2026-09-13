-- ============================================================
--  V6 — Drops programmables, réservation de stock, webhooks idempotents
--  (feuille de route 2026-09, phase 2)
-- ============================================================

-- ---------- Drops ----------
-- lifecycle = ce que l'administration décide (DRAFT / PUBLISHED / ARCHIVED).
-- L'état visible (SCHEDULED / OPEN / CLOSED) est dérivé des dates : une seule source de vérité.
CREATE TABLE drops (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug             VARCHAR(160) NOT NULL UNIQUE,
    title            VARCHAR(255) NOT NULL,
    subtitle         VARCHAR(400),
    hero_image       VARCHAR(500),
    opens_at         TIMESTAMPTZ,
    closes_at        TIMESTAMPTZ,
    lifecycle        VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    max_per_customer INTEGER      NOT NULL DEFAULT 1,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_drops_dates CHECK (opens_at IS NULL OR closes_at IS NULL OR closes_at > opens_at),
    CONSTRAINT chk_drops_max_per_customer CHECK (max_per_customer > 0)
);

CREATE TABLE drop_products (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    drop_id       UUID    NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
    product_id    UUID    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_drop_products UNIQUE (drop_id, product_id)
);
CREATE INDEX idx_drop_products_drop ON drop_products(drop_id);

-- ---------- Réservations de stock ----------
-- Une réservation ACTIVE retient du stock avant paiement ; elle expire d'elle-même.
CREATE TABLE stock_reservations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products(id),
    order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    quantity    INTEGER     NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_stock_reservations_quantity CHECK (quantity > 0)
);
CREATE INDEX idx_stock_reservations_product_status ON stock_reservations(product_id, status);
CREATE INDEX idx_stock_reservations_order          ON stock_reservations(order_id);
CREATE INDEX idx_stock_reservations_expires        ON stock_reservations(status, expires_at);

-- ---------- Événements Stripe traités (idempotence) ----------
CREATE TABLE stripe_events (
    id          VARCHAR(255) PRIMARY KEY,
    type        VARCHAR(120) NOT NULL,
    received_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Commandes et produits : contraintes ----------
ALTER TABLE orders ADD COLUMN drop_id UUID REFERENCES drops(id) ON DELETE SET NULL;
CREATE INDEX idx_orders_stripe_reference ON orders(stripe_reference);

ALTER TABLE products    ADD CONSTRAINT chk_products_stock_non_negative    CHECK (stock >= 0);
ALTER TABLE order_items ADD CONSTRAINT chk_order_items_quantity_positive CHECK (quantity > 0);

-- ---------- Premier drop, en brouillon : aucune date, invisible du public ----------
-- L'administration (phase 7) fixera opens_at / closes_at et passera lifecycle à PUBLISHED.
INSERT INTO drops (slug, title, subtitle, lifecycle, max_per_customer)
VALUES ('drop-001', 'Drop 001 — Les Fondations',
        'Trois pièces numérotées pour celles et ceux qui bâtissent.', 'DRAFT', 2);

INSERT INTO drop_products (drop_id, product_id, display_order)
SELECT d.id, p.id, (row_number() OVER (ORDER BY p.price_cents DESC)) - 1
FROM drops d, products p
WHERE d.slug = 'drop-001';
