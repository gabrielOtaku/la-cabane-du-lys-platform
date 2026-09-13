# Feuille de route V2 — suivi d'avancement

> Source : *Feuille de route technique et créative de La Cabane du Lys*, version du 13 septembre 2026.
> Ce fichier est le backlog vivant demandé par la feuille de route (« mettre à jour la colonne Statut chaque semaine »).
> Légende : `[x]` fait et vérifié (tests / build verts) · `[~]` partiel · `[ ]` à faire.

Dernière mise à jour : 2026-09-12 (branche `v2`).

---

## Référence (Phase 0)

**Baseline mesurée le 2026-09-12, avant la V2**

| Vérification | Résultat |
| --- | --- |
| `mvn test` (unitaires, H2) | vert — 1 classe (JwtServiceTest) |
| `mvn test -Dtest=EpisodeServiceIT` | non exécutable ici : Docker Desktop arrêté (Testcontainers) |
| `npm run typecheck` | vert |
| `npm run lint` | vert |
| Lighthouse | **non mesuré** : nécessite un navigateur et le site lancé ; à faire en préproduction (phase 8) |

**Après la V2 (même jour)**

| Vérification | Résultat |
| --- | --- |
| `mvn test -Dtest='!EpisodeServiceIT'` | 32 tests verts : JWT (5), flux d'identité (16), boutique (9), webhook (2) |
| `npm run typecheck` · `npm run lint` · `npm run build` | verts |

**Fonctions incomplètes connues** : passkeys sans Redis (indisponibles en profil dev), envoi SMTP non testé en conditions réelles, Hall of Fame 3D sans alternative HTML, page `/confidentialite` absente, favicon / OG / sitemap absents.

---

## Phase 0 — Stabilisation et référence

- [x] README aligné sur les versions réelles (Next 15.5.19, Spring Boot 3.2.5, Java 21)
- [x] Branche de travail `v2` créée — *protection de `main` à activer sur GitHub (réglage du dépôt, hors code)*
- [x] Commandes de démarrage documentées (frontend, backend, base, Redis, Stripe CLI)
- [x] Inventaire des routes (README), des variables d'environnement (docs/ENVIRONNEMENT.md), des fonctions incomplètes (ci-dessus)
- [ ] Mesure Lighthouse accueil / épisode / boutique / connexion / mobile — en préproduction
- [x] Tests verts notés

## Phase 1 — Sécurité de l'identité

- [x] Stratégie de session : cookie HttpOnly · Secure · SameSite=Lax (documentée dans le README)
- [x] Lien magique réel : jeton aléatoire 256 bits, hachage SHA-256 en base, expiration 15 min, courriel, callback `/login/callback`, invalidation atomique
- [x] Bouton de connexion relié au backend : états chargement, envoyé, renvoi (30 s), expiré, erreur
- [x] Claim `role` lue dans `JwtAuthenticationFilter`, rôles invalides refusés
- [x] Routes administratives protégées (`/admin/**` + `@PreAuthorize`)
- [x] Déconnexion, révocation (`jti` en liste Redis) et sessions expirées (401 JSON)
- [x] Tests : lien magique, réutilisation, expiration, 401, 403, rôle inconnu, jeton altéré, CSRF origine, Bearer
- [~] WebAuthn : enregistrement réservé à une session vérifiée, connexion sans courriel — **non testé en conditions réelles (Redis + navigateur)**

## Phase 2 — Drops, paiements et stock

- [x] Entités `Drop` (opensAt, closesAt, lifecycle, slug, heroImage, maxPerCustomer) et `DropProduct`
- [x] Calcul « maintenant + 18 jours » supprimé côté API et côté site
- [x] `StockReservation` (quantité, expiration, état)
- [x] Réservation transactionnelle avec verrou de ligne avant la session Checkout
- [x] Libération automatique des réservations expirées (job chaque minute + événement Stripe `expired`)
- [x] Webhook idempotent (`stripe_events`)
- [x] Prix et produit vérifiés côté serveur ; montant reçu comparé au montant attendu
- [x] Test « deux achats simultanés sur le dernier article »
- [x] Page `/drop` sur l'API réelle (compte à rebours qui atteint zéro, états NONE/SCHEDULED/OPEN/CLOSED) et page `/drop/success`
- [ ] Administration des drops (dates, publication) — phase 7 ; en attendant, `lifecycle` se change en base

## Phase 3 — Lecteur audio unifié

- [x] `AudioPlayerProvider` + `AudioEngine` au niveau du layout
- [x] Temps simulé d'`EpisodePlayer` remplacé par les événements du vrai élément audio
- [x] Même moteur sur l'accueil, la page épisode et le mini lecteur
- [x] Transcription synchronisée (segments horodatés, navigation par phrase)
- [x] Lecture, pause, seek, volume, vitesse (API), reprise après navigation (position sauvegardée localement)
- [x] Waveform et braises pilotées par l'intensité sonore
- [x] États : média absent, chargement, erreur réseau, lecture refusée, fin d'extrait
- [x] Clavier (slider ARIA, flèches, Page, Début/Fin) et libellés accessibles
- [ ] Tests unitaires du moteur (JSDOM) — à ajouter en phase 8 avec l'outillage de test frontend (aucun runner installé aujourd'hui)

## Phase 4 — Identité interactive

- [x] Symbole SVG `#lysmark` réutilisé, point blanc supprimé
- [x] Fleur de 16 px sur bureau
- [x] Halo avec inertie, transformations limitées (échelle ≤ 2)
- [x] 6 à 9 lucioles par clic, 400 à 800 ms, trajectoires variées, disparition douce
- [x] Modes lien, bouton, texte (curseur natif dans les champs), lecture, pause, 3D
- [x] Désactivé sur tactile et mouvement réduit ; curseur natif conservé
- [x] Particules retirées du DOM après animation, plafond de 80 simultanées
- [ ] Tests desktop / tactile / clavier — vérification manuelle à faire

## Phase 5 — Accueil et système visuel

- [x] Hero réécrit : proposition de valeur, appel principal, appel secondaire
- [x] Promesses génériques remplacées par des preuves réelles (`HeroProof`)
- [~] Tokens : mouvement (`--motion-*`, `--ease-standard`, `--glow-*`) posés ; couleur/typo/espace existants dans `globals.css`, non encore documentés
- [~] Familles d'animation : braise (lecteur) et luciole (clic) en place ; gravure/dorure à formaliser
- [ ] Système culturel Québec / France / Madagascar
- [ ] Réduction des couches d'effets ; déclinaison mobile / tablette / grand écran à revoir

## Phase 6 — Données et modularisation frontend

- [x] API source de vérité ; fixtures limitées au développement (`lib/fixtures.ts`)
- [x] Clés TanStack Query et stale time documentés (`lib/queries.ts`)
- [x] `Skeleton`, `ErrorState`, `EmptyState` réutilisables
- [~] CSS : nouveaux styles dans `src/styles/` (`v2.css`, `audio.css`, `cursor.css`) ; `globals.css` (57 Ko) à découper
- [ ] Chargement dynamique de la 3D hors Hero ; dépendances inutilisées à vérifier
- [x] Types frontend alignés sur les DTO backend (Session, DropDto, Product.remaining, OrderStatus)

## Phase 7 — Back office

- [~] `GET /admin/overview` (compteurs) ; navigation, édition des épisodes/invités/drops, journal d'audit à faire

## Phase 8 — Qualité et lancement

- [ ] CI (lint, compilation, tests, migrations sur base vide)
- [ ] Environnements dev / préprod / prod ; logs structurés déjà prêts (profil `docker`/`prod`)
- [ ] Audits Lighthouse, accessibilité, dépendances, en-têtes
- [ ] Sauvegardes, restauration, retour arrière
- [ ] Évaluer Spring Boot 3.5 + Java 25 (décision : rester sur Java 21 pour la V2)

---

## Backlog priorisé (colonne Statut)

| Priorité | Zone | Tâche | Échéance | Statut |
| --- | --- | --- | --- | --- |
| P0 | Auth | Implémenter le lien magique à usage unique | Phase 1 | Fait |
| P0 | Auth | Relier la session frontend et backend | Phase 1 | Fait |
| P0 | Auth | Corriger la lecture des rôles JWT | Phase 1 | Fait |
| P0 | Boutique | Créer Drop et supprimer le calcul glissant | Phase 2 | Fait |
| P0 | Boutique | Réserver le stock de manière transactionnelle | Phase 2 | Fait |
| P0 | Stripe | Rendre les webhooks idempotents | Phase 2 | Fait |
| P1 | Audio | Créer le moteur audio partagé | Phase 3 | Fait |
| P1 | Audio | Ajouter le mini lecteur persistant | Phase 3 | Fait |
| P1 | Audio | Synchroniser la transcription | Phase 3 | Fait |
| P1 | Design | Créer le curseur fleur de lys | Phase 4 | Fait |
| P1 | Design | Créer les lucioles et modes accessibles | Phase 4 | Fait |
| P1 | Accueil | Réviser Hero et preuves | Phase 5 | Fait (à affiner) |
| P1 | Design | Formaliser tokens et familles d'animation | Phase 5 | En cours |
| P1 | Données | Supprimer les fallbacks locaux en production | Phase 6 | Fait |
| P1 | CSS | Découper globals.css | Phase 6 | En cours |
| P2 | Admin | Gérer épisodes, invités et transcriptions | Phase 7 | À faire |
| P2 | Admin | Gérer drops, produits et stock | Phase 7 | À faire |
| P2 | Qualité | Ajouter CI, préproduction et observabilité | Phase 8 | À faire |
| P2 | SEO | Ajouter métadonnées et cartes de partage | Phase 8 | À faire |
| P3 | Produit | Évaluer flux RSS et statistiques d'écoute | Après V2 | À évaluer |

## Décisions prises pendant la V2

- **Java 21 conservé.** Spring Boot 3.2.5 n'est pas certifié Java 25 (Lombok, ByteBuddy/Hibernate, Mockito) et le JDK 25 n'est pas installé. La montée passe par Spring Boot 3.5+ : tâche de phase 8.
- **Connexion par passkey sans courriel.** Le défi est identifié par un `challengeId` aléatoire ; l'authentificateur désigne le compte. Cela supprime l'énumération des comptes à la connexion.
- **État du drop dérivé des dates.** Une seule source de vérité (`lifecycle` + dates), aucune colonne d'état stockée qui pourrait contredire le compte à rebours.
- **Réservation avant Stripe, hors verrou réseau.** La réservation est validée dans sa propre transaction, puis la session Stripe est créée ; en cas d'échec Stripe, la réservation est libérée.
