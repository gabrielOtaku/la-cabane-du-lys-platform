# La Cabane du Lys — Plateforme

> Maison éditoriale entrepreneuriale francophone, née au Cégep de Saint-Félicien.
> Direction artistique : **Obsidienne · Bronze · Ambre** — le feu, la voix et la fleur de lys.

Monorepo piloté par la *Feuille de route technique et créative* (13 septembre 2026).
Suivi d'avancement : [docs/ROADMAP_STATUS.md](docs/ROADMAP_STATUS.md). Variables : [docs/ENVIRONNEMENT.md](docs/ENVIRONNEMENT.md).

---

## Architecture

```
la-cabane-du-lys-platform/
├── frontend/   → Next.js 15.5 (App Router) · React 18.3 · TypeScript 5.5 · TanStack Query 5 · Zustand · Framer Motion · Lenis · R3F
├── backend/    → Java 21 · Spring Boot 3.5.16 · Spring Security · JPA/Hibernate · Flyway · PostgreSQL 16 · Redis 7 · Stripe · WebAuthn4J
└── docs/       → environnement, backlog, décisions
```

| Couche | Pile réelle (package.json / pom.xml) |
| --- | --- |
| **Front-end** | Next.js 15.5.25, React 18.3.1, TypeScript 5.5.3, Tailwind 3.4, Framer Motion 11, Lenis 1.1, Three 0.166 + React Three Fiber 8 + Drei 9, Zustand 4.5, TanStack Query 5.51, lucide-react |
| **Back-end** | Java 21 (Temurin), Spring Boot 3.5.16, Spring Security 6.5, Jackson 2.22, JJWT 0.13, WebAuthn4J 0.31, Spring Data JPA, Flyway 11 (module PostgreSQL), Stripe Java 33.4, Spring Mail, Logstash encoder 9 |
| **Données / Infra** | PostgreSQL 16, Redis 7, Docker Compose, Testcontainers (tests d'intégration), H2 (profil dev) |

---

## Démarrage rapide

### Tout en conteneurs

Prérequis : Docker + Docker Compose.

```bash
cp .env.example .env        # ajustez les secrets
docker compose up --build
```

- Site : http://localhost:3000 · API : http://localhost:8080/api · PostgreSQL `localhost:5432` · Redis `localhost:6379`

### Développement sans Docker

**Backend** (JDK 21 + Maven 3.9) — base H2 en mémoire, Redis toléré absent :

```bash
cd backend
mvn spring-boot:run        # profil dev activé par le plugin
```

Sans Redis : le rate limiting et la révocation de session sont en *fail-open* (documenté), les passkeys sont indisponibles. Le lien magique est écrit dans la console (`MAIL_MODE=log`).

**Frontend** :

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

**Stripe en local** (webhooks) :

```bash
stripe listen --forward-to localhost:8080/api/shop/webhook
# copier le secret whsec_… affiché dans STRIPE_WEBHOOK_SECRET, puis relancer le backend
stripe trigger checkout.session.completed
```

### Vérifications

```bash
# backend : tests unitaires + flux d'authentification + passkeys émulées + boutique + back office (H2)
cd backend && mvn test -Dtest='!EpisodeServiceIT'
# backend : test d'intégration PostgreSQL réel (Docker requis)
cd backend && mvn test -Dtest=EpisodeServiceIT
# frontend
cd frontend && npm run typecheck && npm run lint && npm run build
```

---

## Ce qui est en place (V2, phases 0 à 7)

| Domaine | État | Détail |
| --- | --- | --- |
| Identité | ✅ | Lien magique à usage unique (SHA-256 en base, 15 min, un seul clic), session en cookie **HttpOnly · Secure · SameSite=Lax**, révocation à la déconnexion, rôle lu et validé depuis le jeton, `/admin/**` réservé au rôle ADMIN, 401/403 en JSON RFC 7807, protection CSRF par vérification d'origine. |
| Passkeys | ✅ | Enregistrement réservé à une session ouverte (adresse vérifiée) ; connexion sans courriel (credential discoverable), aucune énumération de comptes. Flux complet couvert par `WebAuthnFlowTest` avec l'authentificateur émulé de WebAuthn4J. |
| Boutique | ✅ | Entité `Drop` (dates persistées, cycle de vie DRAFT/PUBLISHED/ARCHIVED, état SCHEDULED/OPEN/CLOSED dérivé), réservation de stock transactionnelle avec verrou de ligne avant Stripe, limite par client, expiration automatique, webhooks idempotents, montant vérifié côté serveur. |
| Audio | ✅ | Moteur unique (`features/audio`) : un seul élément audio, analyse fréquentielle réelle, lecture persistante pendant la navigation, mini lecteur, transcription synchronisée navigable, clavier et mouvement réduit. |
| Identité interactive | ✅ | Curseur fleur de lys seule (symbole SVG partagé, 28 px, sans halo), modes lien/bouton/texte/lecture/3D exprimés par l'échelle et l'inclinaison, lucioles au clic (6 à 9, 400 à 800 ms) avec variante Play ; désactivé sur tactile et mouvement réduit. |
| Accueil | ✅ | Hero V2 (proposition, appel principal, appel secondaire), preuves réelles, tokens documentés, trois familles d'animation, système culturel discret. Guide : `docs/DIRECTION_ARTISTIQUE.md`. |
| Données | ✅ | API source de vérité ; fixtures locales limitées au développement ; états Skeleton/Erreur/Vide réutilisables ; CSS découpé par section dans `src/styles/` (voir `globals.css`). |
| Back office | ✅ | `/admin` : épisodes (brouillons, publication, transcription), invités, drops (dates, cycle de vie, pièces), pièces et stock, commandes, journal d'audit. Validation serveur affichée par champ, confirmations avant actions sensibles. |

Routes publiques : `/`, `/episodes`, `/episodes/[slug]`, `/invites`, `/invites/[slug]`, `/a-propos`, `/participer`, `/contact`, `/login`, `/login/callback`, `/drop`, `/drop/success`, `/hall-of-fame`.
Back office (rôle ADMIN) : `/admin`, `/admin/episodes`, `/admin/invites`, `/admin/drops`, `/admin/produits`, `/admin/commandes`, `/admin/journal`. Le premier administrateur se crée en base après une première connexion par lien magique : `UPDATE users SET role = 'ADMIN' WHERE email = '…';`

## API (résumé)

| Méthode | Route | Accès | Rôle |
| --- | --- | --- | --- |
| POST | `/auth/magic-link` | public (5/min/IP) | Demande un lien ; réponse identique quelle que soit l'adresse |
| POST | `/auth/magic-link/verify` | public | Consomme le lien, pose le cookie de session |
| GET / POST | `/auth/me` · `/auth/logout` | session | Session courante · fermeture + révocation |
| POST | `/auth/webauthn/register/*` | session | Ajout d'une passkey au compte vérifié |
| POST | `/auth/webauthn/login/*` | public | Connexion par passkey, sans courriel |
| GET | `/episodes`, `/episodes/{slug}`, `/episodes/search?q=` | public | Épisodes publiés uniquement |
| GET | `/guests`, `/guests/{slug}` | public | Invités |
| GET | `/shop/drop` | public | Drop courant, dates réelles, stock restant |
| POST | `/shop/checkout` | session | Réservation puis session Stripe Checkout |
| GET | `/shop/orders/{id}/status` | public | État d'une commande (aucune donnée personnelle) |
| POST | `/shop/webhook` | Stripe (signé) | `checkout.session.completed` / `expired` / `async_payment_failed` |
| GET | `/admin/overview` | ADMIN | Compteurs |
| CRUD | `/admin/episodes`, `/admin/episodes/{id}/publish` · `/unpublish` | ADMIN | Épisodes, brouillons inclus |
| CRUD | `/admin/guests` | ADMIN | Invités |
| CRUD | `/admin/drops`, `/admin/drops/{id}/lifecycle` | ADMIN | Drops et cycle de vie |
| CRUD | `/admin/products` | ADMIN | Pièces et stock |
| GET / POST | `/admin/orders`, `/admin/orders/{id}/fulfill` | ADMIN | Commandes |
| GET | `/admin/audit` | ADMIN | Journal d'audit |

## Sécurité — décisions

- **Session** : cookie HttpOnly signé (JWT HS256, `jti` révocable via Redis). Le JavaScript ne voit jamais le secret.
- **CSRF** : SameSite=Lax + en-tête `Origin` (ou `Referer`) obligatoire et égal à `CORS_ORIGIN` pour toute requête non sûre authentifiée par cookie.
- **Rate limiting** : par route et par IP (Redis, fenêtre fixe) ; `X-Forwarded-For` ignoré sauf `TRUST_FORWARDED_FOR=true` derrière un proxy de confiance.
- **Paiement** : prix et quantités calculés côté serveur ; webhook signé ; un identifiant d'événement n'est traité qu'une fois.
- **Secrets** : jamais dans Git ; valeurs par défaut volontairement reconnaissables (`replace_me`).
- **Dépendances** : `npm audit` à zéro (Next 15.5.25 ; `overrides` npm pour `postcss` et `fflate`, épinglés par des dépendances transitives) ; Spring Boot 3.5.16 (Spring Security 6.5.11, Spring Framework 6.2.19) avec Tomcat 10.1.59, Netty 4.1.138, pilote PostgreSQL 42.7.13, Jackson 2.22.2 et Log4j API 2.25.5 épinglés dans le `pom.xml` (à retirer quand Boot les rattrape) ; Stripe, WebAuthn4J, JJWT et Logstash encoder à leur dernière version. Vérifier après chaque montée : `cd frontend && npm audit`, `docker scout cves <image>`.
- **Images Docker** : bases Alpine (`eclipse-temurin:21-jre-alpine`, `node:22-alpine`), paquets système mis à jour au build, processus non-root ; frontend en sortie Next « standalone » sans npm à l'exécution (328 Mo, 0 vulnérabilité Docker Scout) ; backend 466 Mo, 0 critique / 0 élevée (reste coreutils et gnupg Alpine, sans correctif publié). Reconstruire avec `docker compose build --pull` pour récupérer les dernières bases.
