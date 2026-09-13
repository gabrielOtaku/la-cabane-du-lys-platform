-- ============================================================
--  V4 — Modèle multi-invités, slugs stables, retrait des données
--  de démonstration fictives (audit du 19 août 2026, §7.3 et §15.2)
-- ============================================================

-- ---------- Invités : profils réels, taxonomie libre ----------
ALTER TABLE guests
    ADD COLUMN slug        VARCHAR(160),
    ADD COLUMN city        VARCHAR(120),
    ADD COLUMN region      VARCHAR(120),
    ADD COLUMN category    VARCHAR(120),
    ADD COLUMN angle       VARCHAR(400),
    ADD COLUMN bio         VARCHAR(2000),
    ADD COLUMN photo_url   VARCHAR(500),
    ADD COLUMN company_url VARCHAR(500),
    ADD COLUMN featured    BOOLEAN NOT NULL DEFAULT FALSE;

-- Le CA/l'effectif ne sont plus des champs obligatoires : jamais affichés par défaut (audit §3.2)
ALTER TABLE guests ALTER COLUMN sector DROP NOT NULL;

-- ---------- Épisodes : slug stable, statut de publication, plateformes ----------
ALTER TABLE episodes
    ADD COLUMN slug               VARCHAR(160),
    ADD COLUMN status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN short_description   VARCHAR(400),
    ADD COLUMN thumbnail_url       VARCHAR(500),
    ADD COLUMN youtube_id          VARCHAR(60),
    ADD COLUMN spotify_url         VARCHAR(500),
    ADD COLUMN apple_url           VARCHAR(500),
    ADD COLUMN guest_names_cache   VARCHAR(500) NOT NULL DEFAULT '';

-- ---------- Relation plusieurs-à-plusieurs épisodes <-> invités (audit §7.3) ----------
CREATE TABLE episode_guests (
    episode_id    UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    guest_id      UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (episode_id, guest_id)
);

-- ---------- Retrait des données de démonstration fictives ----------
-- Elles n'ont jamais dû être visibles publiquement (audit §2.3) ; aucune commande/membre
-- réel ne dépend encore de ces lignes à ce stade du projet.
DELETE FROM episodes;
DELETE FROM guests;

-- Recréer le vecteur de recherche : dépendait de guest_name (colonne dépréciée, conservée
-- mais non utilisée), il dépend désormais de guest_names_cache maintenu par EpisodeService.
DROP INDEX IF EXISTS idx_episodes_search;
ALTER TABLE episodes DROP COLUMN IF EXISTS search_vec;
ALTER TABLE episodes
    ADD COLUMN search_vec tsvector
        GENERATED ALWAYS AS (
            to_tsvector('french',
                coalesce(title,             '') || ' ' ||
                coalesce(short_description, '') || ' ' ||
                coalesce(description,       '') || ' ' ||
                coalesce(guest_names_cache, '') || ' ' ||
                coalesce(transcript_json,   ''))
        ) STORED;
CREATE INDEX idx_episodes_search ON episodes USING GIN (search_vec);

ALTER TABLE guests ADD CONSTRAINT uq_guests_slug UNIQUE (slug);
ALTER TABLE episodes ADD CONSTRAINT uq_episodes_slug UNIQUE (slug);

-- ---------- Invités réels validés (audit Annexe A + sites officiels des entreprises) ----------
-- Aucune donnée financière. Bios sourcées de matsheshucreations.com, shampoingauto.com et
-- web-icom.com. Aucune photo disponible pour l'instant (non fournie par les invités,
-- y compris pour les vidéos tournées) : photo_url reste NULL plutôt qu'un visuel générique.
INSERT INTO guests (id, name, slug, role, company, company_url, city, region, category, angle, bio, featured) VALUES
 (gen_random_uuid(), 'Raphaëlle Langevin', 'raphaelle-langevin',
  'Fondatrice', 'Matsheshu Créations', 'https://matsheshucreations.com',
  'Mashteuiatsh', 'Saguenay-Lac-Saint-Jean', 'Création & design autochtone',
  'Création, identité, entrepreneuriat culturel, développement d''une marque et d''une communauté.',
  'Fondatrice de Matsheshu Créations, une boutique d''artisanat autochtone basée à Mashteuiatsh. L''entreprise propose des bijoux faits main, des vêtements à motifs autochtones et des jupes-rubans — une célébration du savoir-faire des Premières Nations, de Mashteuiatsh jusqu''à vous.',
  TRUE),
 (gen_random_uuid(), 'Steeven Hatotte', 'steeven-hatotte',
  'Fondateur', 'SHampoing Auto', 'https://shampoingauto.com',
  'Saint-Félicien', 'Saguenay-Lac-Saint-Jean', 'Service automobile',
  'Démarrage local, acquisition de clientèle, qualité de service, ambition de croissance.',
  'Fondateur de SHampoing Auto, une entreprise d''esthétique et de nettoyage automobile basée à Saint-Félicien.',
  TRUE),
 (gen_random_uuid(), 'Régis Lapierre Girard', 'regis-lapierre-girard',
  'Président — ventes et service', 'Web-Icom Solutions', 'https://web-icom.com',
  NULL, 'Saguenay-Lac-Saint-Jean', 'Solutions technologiques & commerciales',
  'Entrepreneuriat technologique/commercial, solutions aux commerces, complémentarité entre associés.',
  'Président de Web-Icom Solutions, responsable des ventes et du service. L''entreprise propose des systèmes de caisse et de paiement infonuagiques pour les commerces du Québec, dont le système Colossale Cloud.',
  TRUE),
 (gen_random_uuid(), 'Corentin Guyon', 'corentin-web-icom',
  'Technicien & installateur', 'Web-Icom Solutions', 'https://web-icom.com',
  NULL, 'Saguenay-Lac-Saint-Jean', 'Solutions technologiques & commerciales',
  'Entrepreneuriat technologique/commercial, solutions aux commerces, complémentarité entre associés.',
  'Technicien et installateur chez Web-Icom Solutions, responsable du support technique et de l''installation des systèmes de caisse.',
  TRUE);

UPDATE guests SET quote = 'Notre mission est d''offrir la possibilité à tout type de commerce de pouvoir se concentrer à 100 % sur son commerce.'
  WHERE slug = 'regis-lapierre-girard';
UPDATE guests SET quote = 'Nous nous efforçons chaque jour de proposer le meilleur service à nos clients.'
  WHERE slug = 'corentin-web-icom';

-- ---------- Épisodes réels — tournés, en post-production, non encore publiés ----------
-- Ne pas renseigner published_at/duration_sec/youtube_id tant que l'épisode n'est pas en ligne :
-- le statut DRAFT les garde hors des réponses publiques (voir EpisodeService).
INSERT INTO episodes (id, number, slug, title, status, short_description, guest_names_cache) VALUES
 (gen_random_uuid(), 1, 'raphaelle-langevin-matsheshu-creations',
  'Raphaëlle Langevin — Matsheshu Créations', 'DRAFT',
  'Création, identité et entrepreneuriat culturel à Mashteuiatsh.', 'Raphaëlle Langevin'),
 (gen_random_uuid(), 2, 'steeven-hatotte-shampoing-auto',
  'Steeven Hatotte — SHampoing Auto', 'DRAFT',
  'Démarrage local et acquisition de clientèle à Saint-Félicien.', 'Steeven Hatotte'),
 (gen_random_uuid(), 3, 'web-icom-solutions',
  'Régis Lapierre Girard & Corentin — Web-Icom Solutions', 'DRAFT',
  'Entrepreneuriat technologique et complémentarité entre associés.', 'Régis Lapierre Girard, Corentin');

-- ---------- Liaison épisodes <-> invités ----------
INSERT INTO episode_guests (episode_id, guest_id, display_order)
SELECT e.id, g.id, 0 FROM episodes e, guests g
WHERE e.slug = 'raphaelle-langevin-matsheshu-creations' AND g.slug = 'raphaelle-langevin';

INSERT INTO episode_guests (episode_id, guest_id, display_order)
SELECT e.id, g.id, 0 FROM episodes e, guests g
WHERE e.slug = 'steeven-hatotte-shampoing-auto' AND g.slug = 'steeven-hatotte';

INSERT INTO episode_guests (episode_id, guest_id, display_order)
SELECT e.id, g.id, 0 FROM episodes e, guests g
WHERE e.slug = 'web-icom-solutions' AND g.slug = 'regis-lapierre-girard';

INSERT INTO episode_guests (episode_id, guest_id, display_order)
SELECT e.id, g.id, 1 FROM episodes e, guests g
WHERE e.slug = 'web-icom-solutions' AND g.slug = 'corentin-web-icom';

-- ---------- Retrait des compteurs sociaux fictifs (audit §15.3) ----------
-- SocialStatsJob attend toujours une source de collecte fiable (TODO externe) : on affiche
-- zéro plutôt que des chiffres inventés tant que ce n'est pas branché.
UPDATE social_stats SET value = 0, updated_at = now();
