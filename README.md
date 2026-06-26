# La Cabane du Lys — Plateforme

> Écosystème médiatique & e-commerce haut de gamme dédié à la réalité brute de l'entrepreneuriat.
> Direction artistique : **« Luxe Sombre & Immersif »** — Obsidienne · Bronze Brossé · Ambre.

Monorepo conforme au *Cahier des charges fonctionnel & technique v1.0*.

---

## Architecture

```
la-cabane-du-lys-platform/
├── frontend/   → Next.js 14 (App Router) · React · TypeScript · Tailwind · R3F · Framer Motion · Lenis
└── backend/    → Java 21 · Spring Boot 3 · Spring Security (JWT + WebAuthn) · JPA · Flyway · PostgreSQL · Redis · Stripe
```

| Couche | Pile |
| --- | --- |
| **Front-end** | Next.js 14, React 18, TypeScript, Tailwind CSS, Shadcn/UI, Framer Motion, Lenis, Three.js + React Three Fiber + Drei, Zustand, TanStack Query |
| **Back-end** | Java 21, Spring Boot 3.2, Spring Security, WebAuthn (Passkeys), JWT, Spring Data JPA / Hibernate, Flyway |
| **Données / Infra** | PostgreSQL 16, Redis 7, Stripe API, Docker, Cloudflare (WAF/CDN), AWS/GCP |

---

## Démarrage rapide (tout en conteneurs)

Prérequis : **Docker** + **Docker Compose**.

```bash
cp .env.example .env        # ajustez les secrets
docker compose up --build
```

- Frontend : http://localhost:3000
- API : http://localhost:8080/api
- PostgreSQL : `localhost:5432` · Redis : `localhost:6379`

## Démarrage en développement (sans Docker)

### Backend
```bash
cd backend
# Lance Postgres + Redis localement (ou : docker compose up db redis)
mvn spring-boot:run          # nécessite JDK 21 + Maven, ou utilisez Docker
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

---

## Modules livrés

| Page / Module | Route | État |
| --- | --- | --- |
| L'Édifice (accueil) | `/` | ✅ Expérience immersive complète |
| Le Coffre (lecteur + transcription) | `/episodes/[id]` | ✅ Lecteur sur-mesure (recherche sémantique = à brancher) |
| La Salle des Trophées (3D) | `/hall-of-fame` | ✅ Scène WebGL R3F navigable |
| Le Cercle (auth passwordless) | `/login` | ✅ UI + hook WebAuthn (ceremony serveur = à finaliser) |
| La Réserve (drop éphémère) | `/drop` | ✅ Compte à rebours + vitrine (paiement Stripe = à brancher) |

> Les contenus (épisodes, invités, dates de drop) sont des **données de démonstration** dans
> `frontend/src/data/`. Le backend expose déjà les endpoints REST correspondants — il suffit de
> connecter le frontend à l'API via `NEXT_PUBLIC_API_URL` et de remplir la base.

## Sécurité (stratégie « Zero Trust »)

- **Passwordless / WebAuthn** : `useWebAuthn` côté front + `WebAuthnConfig`/`AuthController` côté back (squelette de ceremony fourni).
- **JWT** : `JwtService` + `JwtAuthenticationFilter` pour les sessions API.
- **Chiffrement** : TLS 1.3 en transit, AES-256 au repos (config base) — à activer en production.
- **Périmètre** : WAF + protection DDoS via Cloudflare (hors code applicatif).

## Roadmap d'industrialisation

1. Brancher le frontend sur l'API (remplacer les mocks `data/` par TanStack Query).
2. Finaliser la ceremony WebAuthn (challenge/attestation/assertion) serveur ↔ navigateur.
3. Intégrer Stripe (PaymentIntents + webhooks) pour La Réserve.
4. Activer Redis (cache épisodes + compteurs sociaux via Cron).
5. CI/CD + déploiement (Docker → AWS/GCP) derrière Cloudflare Enterprise.
