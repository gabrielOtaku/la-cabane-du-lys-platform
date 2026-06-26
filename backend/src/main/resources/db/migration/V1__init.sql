-- ============================================================
--  V1 — Schéma initial : membres, authentificateurs, invités, épisodes
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Membres du Cercle Privé
CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    role         VARCHAR(20)  NOT NULL DEFAULT 'MEMBER',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Authentificateurs WebAuthn (Passkeys)
CREATE TABLE webauthn_credentials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id   VARCHAR(512)  NOT NULL UNIQUE,
    public_key      VARCHAR(1024) NOT NULL,
    signature_count BIGINT        NOT NULL DEFAULT 0,
    user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_credentials_user ON webauthn_credentials(user_id);

-- Invités (reliques de la Salle des Trophées)
CREATE TABLE guests (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name      VARCHAR(255) NOT NULL,
    role      VARCHAR(255),
    company   VARCHAR(255),
    sector    VARCHAR(30)  NOT NULL,
    revenue   VARCHAR(255),
    employees INTEGER      NOT NULL DEFAULT 0,
    quote     VARCHAR(600),
    lesson    VARCHAR(600)
);

-- Épisodes (Le Coffre)
CREATE TABLE episodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number          INTEGER       NOT NULL UNIQUE,
    title           VARCHAR(255)  NOT NULL,
    guest_name      VARCHAR(255),
    sector          VARCHAR(30),
    duration_sec    INTEGER       NOT NULL DEFAULT 0,
    published_at    DATE,
    description     VARCHAR(2000),
    audio_url       VARCHAR(255),
    video_url       VARCHAR(255),
    transcript_json TEXT
);

-- Données de démonstration ------------------------------------------------
INSERT INTO guests (name, role, company, sector, revenue, employees, quote, lesson) VALUES
 ('Marc Tremblay',  'Fondateur & PDG',     'Boréal Motors',     'AUTOMOBILE',      '18 M$ / an',  42,  'On m''avait promis que ça allait être simple. Ça ne l''a jamais été.', 'Vendre, c''est écouter deux fois avant de parler une fois.'),
 ('Sophie Gagnon',  'Cofondatrice',        'Lumen Data',        'TECH',            '9,5 M$ / an', 28,  'La première année, j''ai travaillé 80 heures par semaine pour presque rien.', 'Échouer assez tôt, c''est apprendre assez vite.'),
 ('Léa Bouchard',   'Cheffe & Propriétaire','Maison Lavoie',    'RESTAURATION',    '4,2 M$ / an', 35,  'Les réseaux sociaux montrent l''assiette. Jamais les nuits blanches derrière.', 'La constance bat le talent quand le talent n''est pas constant.'),
 ('Daniel Côté',    'Président',           'Côté Construction', 'CONSTRUCTION',    '31 M$ / an',  120, 'Le pire conseil reçu ? Lâche ta job tout de suite.', 'Bâtis tes fondations avant tes étages.'),
 ('Émilie Lavoie',  'Fondatrice',          'Terroir du Lac',    'AGROALIMENTAIRE', '6,8 M$ / an', 54,  'Si je recommençais, je commencerais plus petit, mais plus honnête.', 'Un bon produit se raconte tout seul.');

INSERT INTO episodes (number, title, guest_name, sector, duration_sec, published_at, description, transcript_json) VALUES
 (12, 'Vendre une voiture, vendre un rêve', 'Marc Tremblay', 'AUTOMOBILE', 3852, '2026-05-28',
  'Marc Tremblay raconte son passage de vendeur à dirigeant de Boréal Motors — sans diplôme, mais avec une obsession du service.',
  '[{"t":0,"text":"« On m''avait promis que ça allait être simple. »"},{"t":642,"text":"« La première année, j''ai travaillé 80 heures par semaine. »"},{"t":1284,"text":"« Le pire conseil : lâche ta job tout de suite. »"}]'),
 (11, 'La donnée comme matière première', 'Sophie Gagnon', 'TECH', 3120, '2026-05-14',
  'De la recherche universitaire à une scale-up de 28 personnes : Sophie démystifie le mythe de la levée de fonds facile.',
  '[{"t":0,"text":"« Tout le monde voyait la levée. Personne ne voyait les refus. »"},{"t":520,"text":"« On a pivoté trois fois. »"}]'),
 (10, 'Le feu en cuisine, le calme en affaires', 'Léa Bouchard', 'RESTAURATION', 2880, '2026-04-30',
  'Léa Bouchard sur la réalité d''un restaurant rentable : marges minces et discipline invisible.',
  '[{"t":0,"text":"« Une assiette parfaite, c''est cent assiettes ratées avant. »"}]');
