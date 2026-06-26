-- ============================================================
--  V2 — Boutique capsule : produits, commandes, lignes de commande
-- ============================================================

CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    tagline     VARCHAR(600),
    price_cents BIGINT       NOT NULL,
    currency    VARCHAR(3)   NOT NULL DEFAULT 'CAD',
    edition     VARCHAR(255),
    stock       INTEGER      NOT NULL DEFAULT 0,
    available   BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_cents      BIGINT      NOT NULL DEFAULT 0,
    stripe_reference VARCHAR(255),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON orders(user_id);

CREATE TABLE order_items (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id       UUID    NOT NULL REFERENCES products(id),
    quantity         INTEGER NOT NULL,
    unit_price_cents BIGINT  NOT NULL
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Pièces du prochain Drop (scellées par défaut) --------------------------
INSERT INTO products (name, tagline, price_cents, currency, edition, stock, available) VALUES
 ('Hoodie « Bâtisseur »',            'Coton lourd brodé fil or, étiquette numérotée à la main.', 18500, 'CAD', 'Édition limitée — 50 pièces',  50,  FALSE),
 ('Carnet de l''Entrepreneur',       'Cuir pleine fleur, papier ivoire, gravure fleur de lys.',  9000,  'CAD', 'Édition limitée — 100 pièces', 100, FALSE),
 ('Pass VIP — Enregistrement live',  'Accès studio + souper avec l''invité.',                    35000, 'CAD', '10 places par saison',         10,  FALSE);
