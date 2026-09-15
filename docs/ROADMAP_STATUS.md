# Feuille de route V2 — suivi d'avancement

> Source : *Feuille de route technique et créative de La Cabane du Lys*, version du 13 septembre 2026.
> Ce fichier est le backlog vivant demandé par la feuille de route (« mettre à jour la colonne Statut chaque semaine »).
> Légende : `[x]` fait et vérifié (tests / build verts) · `[~]` partiel · `[ ]` à faire.

Dernière mise à jour : 2026-09-14 (branche `v2`).

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

**Après la V2 (2026-09-12 puis 2026-09-14)**

| Vérification | Résultat |
| --- | --- |
| `mvn test -Dtest='!EpisodeServiceIT'` | 42 tests verts : JWT (5), flux d'identité (16), passkeys émulées (2), boutique (9), webhook (2), back office (8) |
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
- [x] WebAuthn : enregistrement réservé à une session vérifiée, connexion sans courriel — flux complet testé avec l'authentificateur émulé de WebAuthn4J (`WebAuthnFlowTest`, 2026-09-14) ; passage sur navigateur réel à confirmer en préproduction

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
- [x] Administration des drops (dates, publication) — livrée en phase 7 (`/admin/drops`)

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
- [x] Fleur de 28 px sur bureau, seule (halo et anneau retirés le 2026-09-14 : « je veux juste la fleur »)
- [x] Transformations limitées (échelle ≤ 1,2, inclinaison 8°), appui court au clic
- [x] 6 à 9 lucioles par clic, 400 à 800 ms, trajectoires variées, disparition douce
- [x] Modes lien, bouton, texte (curseur natif dans les champs), lecture, pause, 3D
- [x] Désactivé sur tactile et mouvement réduit ; curseur natif conservé
- [x] Particules retirées du DOM après animation, plafond de 80 simultanées
- [ ] Tests desktop / tactile / clavier — vérification manuelle à faire

## Phase 5 — Accueil et système visuel

- [x] Hero réécrit : proposition de valeur, appel principal, appel secondaire
- [x] Promesses génériques remplacées par des preuves réelles (`HeroProof`)
- [x] Tokens couleur, culture, espace, rayon, ombre/verre, mouvement et couches dans `styles/base/tokens.css`, documentés dans `docs/DIRECTION_ARTISTIQUE.md`
- [x] Trois familles d'animation : braise (lecteur), luciole (clic), gravure & dorure (`styles/gravure.css` : tracé de l'eyebrow, reflet unique des titres)
- [x] Système culturel : Québec (brume sur La Salle, lys), France (composition éditoriale), Madagascar (terre rouge, trame tissée du Manifeste) — tokens et guide
- [x] Champ de braises en pause hors du Hero et onglet caché
- [ ] Déclinaison mobile / tablette / grand écran à vérifier visuellement

## Phase 6 — Données et modularisation frontend

- [x] API source de vérité ; fixtures limitées au développement (`lib/fixtures.ts`)
- [x] Clés TanStack Query et stale time documentés (`lib/queries.ts`)
- [x] `Skeleton`, `ErrorState`, `EmptyState` réutilisables
- [x] `globals.css` découpé en 14 fichiers `styles/base/*.css` importés dans l'ordre (concaténation vérifiée identique à l'octet) ; `globals.css` ne contient plus que les directives Tailwind et la table des matières
- [x] 3D chargée dynamiquement (`EmberFieldWrapper`, page Hall of Fame) ; champ de braises mis en pause hors écran
- [x] `clsx` et `tailwind-merge` retirés le 2026-09-14 (`cn()` n'était plus appelé)
- [x] Types frontend alignés sur les DTO backend (Session, DropDto, Product.remaining, OrderStatus)

## Phase 7 — Back office

- [x] Navigation administrateur protégée (`/admin`, garde d'affichage par rôle + protection serveur `/admin/**` ADMIN)
- [x] Épisodes : liste (brouillons inclus), création, édition, invités liés, transcription (« mm:ss | texte »), publication / dépublication, suppression
- [x] Invités : liste, création, édition, suppression (refusée si lié à un épisode)
- [x] Drops : liste, création, édition (dates, limite par client, pièces), cycle de vie DRAFT / PUBLISHED / ARCHIVED avec règles de publication
- [x] Pièces : création, édition (stock jamais sous les réservations actives), activation, suppression
- [x] Commandes : liste avec états de paiement, marquage « expédiée » ; aucune donnée inutile exposée
- [x] Validation serveur (422 avec violations par champ) affichée sous chaque champ ; confirmations avant actions sensibles
- [x] Journal d'audit (`audit_events`, migration V7) alimenté par chaque mutation, consultable dans `/admin/journal`
- [x] Tests `AdminApiTest` : 401/403, validation, publication reflétée publiquement, drop programmé reflété sur `/shop/drop`, règles de publication
- [ ] Téléversement de médias (images, audio) : les champs acceptent des URL ; un stockage de fichiers reste à choisir (phase 8)

## Phase 8 — Qualité et lancement

- [ ] CI (lint, compilation, tests, migrations sur base vide)
- [ ] Environnements dev / préprod / prod ; logs structurés déjà prêts (profil `docker`/`prod`)
- [x] Audit des dépendances (2026-09-14) : Next 15.5.25 + overrides `postcss`/`fflate` → `npm audit` à zéro ; Spring Boot 3.2.5 → 3.5.16 (Flyway 11 + module PostgreSQL, JJWT 0.12.7, logstash-logback-encoder 8.1) ; images Docker Alpine, `apk upgrade`, non-root, `.dockerignore` ; Tomcat 10.1.59, Netty 4.1.138, PostgreSQL 42.7.13, Jackson 2.21.6, Log4j API 2.25.5 épinglés ; frontend « standalone » sans npm. Docker Scout : backend 110 → 4 (0 critique, 0 élevée, coreutils/gnupg sans correctif), frontend 19 → 0
- [x] Bibliothèques backend au plus récent (2026-09-14) : Stripe 33.4.2, WebAuthn4J 0.31.10 (API migrée, plus d'appel déprécié), JJWT 0.13.0, Logstash encoder 9.0, Jackson 2.22.2
- [x] Paquets frontend au plus récent de leur majeure (2026-09-14) : TanStack Query 5.102, Lenis 1.3, lucide-react 1.46 (logos retirés de lucide 1.x : icône YouTube locale dans `components/ui/BrandIcons.tsx`), Framer Motion 11.18, Zustand 4.5.7, TypeScript 5.9, ESLint 9.39, Tailwind 3.4.19, @types/node 22
- [ ] Majeures frontend à migrer en une seule vague : React 19 + Next 16 + React Three Fiber 9 + Drei 10 + Three 0.186 + Framer Motion 13 + Zustand 5 + Tailwind 4 + TypeScript 7 + ESLint 10 — pile 3D et CSS à revalider visuellement
- [ ] Audits Lighthouse, accessibilité, en-têtes
- [ ] Sauvegardes, restauration, retour arrière
- [x] Spring Boot 3.5.16 adopté (2026-09-14) ; Java 25 reste à évaluer (Boot 3.5 le prend en charge, JDK 25 non installé)

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
| P1 | Accueil | Réviser Hero et preuves | Phase 5 | Fait |
| P1 | Design | Formaliser tokens et familles d'animation | Phase 5 | Fait |
| P1 | Données | Supprimer les fallbacks locaux en production | Phase 6 | Fait |
| P1 | CSS | Découper globals.css | Phase 6 | Fait |
| P2 | Admin | Gérer épisodes, invités et transcriptions | Phase 7 | Fait |
| P2 | Admin | Gérer drops, produits et stock | Phase 7 | Fait |
| P2 | Qualité | Ajouter CI, préproduction et observabilité | Phase 8 | À faire |
| P2 | SEO | Ajouter métadonnées et cartes de partage | Phase 8 | À faire |
| P3 | Produit | Évaluer flux RSS et statistiques d'écoute | Après V2 | À évaluer |

## Décisions prises pendant la V2

- **Java 21 conservé, Spring Boot 3.5.16 adopté (2026-09-14).** Spring Boot 3.2 n'est plus maintenu et embarquait des CVE critiques (Tomcat, Spring Security, Spring Framework). Boot 3.5 tourne sur Java 21 sans changement de code ; seule adaptation : le module `flyway-database-postgresql` (Flyway 10+). Java 25 pourra suivre quand le JDK sera installé.
- **WebAuthn4J 0.31 et Jackson.** WebAuthn4J embarque Jackson 3 (`tools.jackson`), qui coexiste avec le Jackson 2 de Spring mais exige `jackson-annotations` ≥ 2.22 ; d'où `jackson-bom` 2.22.2. Sans cela, la première passkey échouait à l'exécution (constaté par `WebAuthnFlowTest`).
- **Majeures frontend reportées.** React 19 impose Next 16, React Three Fiber 9 et Drei 10 ; Tailwind 4 change la configuration CSS ; TypeScript 7 change le compilateur. Ces montées se font ensemble, avec vérification visuelle du Hero 3D et des animations, hors du périmètre sécurité (aucune vulnérabilité ouverte sur les versions actuelles).
- **Dépendances transitives épinglées par `overrides` npm.** Next 15.5 épingle `postcss` 8.4.31 et three-stdlib `fflate` 0.6 ; les overrides forcent les versions corrigées, vérifiées par le build. À retirer quand les dépendances amont auront bougé.
- **Connexion par passkey sans courriel.** Le défi est identifié par un `challengeId` aléatoire ; l'authentificateur désigne le compte. Cela supprime l'énumération des comptes à la connexion.
- **État du drop dérivé des dates.** Une seule source de vérité (`lifecycle` + dates), aucune colonne d'état stockée qui pourrait contredire le compte à rebours.
- **Réservation avant Stripe, hors verrou réseau.** La réservation est validée dans sa propre transaction, puis la session Stripe est créée ; en cas d'échec Stripe, la réservation est libérée.
