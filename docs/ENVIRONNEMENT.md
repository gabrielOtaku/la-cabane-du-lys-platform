# Variables d'environnement

> Inventaire de la Phase 0 (feuille de route du 13 septembre 2026). Aucune valeur réelle ici :
> les secrets vivent dans `.env` (ignoré par Git) ou dans le gestionnaire de secrets de l'hébergeur.

Légende : **Obligatoire en prod** = le démarrage sans cette valeur est dangereux ou impossible.

## Backend (Spring Boot)

| Variable | Défaut (dev) | Obligatoire en prod | Rôle |
| --- | --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | *(aucun)* → `dev` via `mvn spring-boot:run` | oui (`prod` ou `docker`) | Sélectionne le profil : `dev` = H2 en mémoire sans Flyway, `docker`/`prod` = PostgreSQL + Redis + logs JSON. |
| `DB_URL` | `jdbc:postgresql://localhost:5432/cabanedulys` | oui | Connexion PostgreSQL 16. |
| `DB_USER` / `DB_PASSWORD` | `cabane` / `change_me_in_prod` | oui | Identifiants PostgreSQL. |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | oui | Rate limiting, challenges WebAuthn, révocation de session, cache. Absent → l'API fonctionne en mode dégradé (fail-open documenté). |
| `JWT_SECRET` | secret de dev explicite | **oui, 32 octets minimum** | Signature HMAC des jetons de session. |
| `SESSION_COOKIE_SECURE` | `true` (`false` dans le profil `dev`) | oui (`true`) | Attribut `Secure` du cookie de session HttpOnly. |
| `SESSION_COOKIE_DOMAIN` | *(vide)* | selon déploiement | Domaine du cookie si l'API et le site sont sur des sous-domaines différents. |
| `CORS_ORIGIN` | `http://localhost:3000` | oui | Origine unique autorisée (CORS + vérification anti-CSRF des requêtes authentifiées par cookie). |
| `BASE_URL` | `http://localhost:3000` | oui | URL publique du site : liens magiques et retours Stripe. |
| `WEBAUTHN_RP_ID` | `localhost` | oui | Identifiant de la Relying Party (nom de domaine sans schéma). |
| `MAIL_MODE` | `log` | oui (`smtp`) | `log` = le lien magique est écrit dans les logs (dev uniquement) ; `smtp` = envoi réel. |
| `MAIL_HOST` / `MAIL_PORT` | *(vide)* / `587` | oui si `smtp` | Serveur SMTP. |
| `MAIL_USER` / `MAIL_PASSWORD` | *(vide)* | oui si `smtp` | Identifiants SMTP. |
| `MAIL_FROM` | `La Cabane du Lys <no-reply@cabanedulys.ca>` | oui si `smtp` | Expéditeur des courriels. |
| `MAGIC_LINK_TTL_MINUTES` | `15` | non | Durée de validité d'un lien magique. |
| `STRIPE_SECRET_KEY` | `sk_test_replace_me` | oui | Clé secrète Stripe (jamais la clé publique). |
| `STRIPE_WEBHOOK_SECRET` | `whsec_replace_me` | oui | Secret de signature du webhook `POST /api/shop/webhook`. |
| `STOCK_HOLD_MINUTES` | `30` | non | Durée de réservation du stock avant expiration (minimum Stripe : 30). |
| `TRUST_FORWARDED_FOR` | `false` | selon déploiement | `true` uniquement derrière un reverse proxy de confiance qui réécrit `X-Forwarded-For`. |
| `MAGIC_LINK_ENABLED` | `true` | non | Interrupteur d'urgence pour désactiver la connexion par lien magique. |

## Frontend (Next.js)

| Variable | Défaut | Obligatoire en prod | Rôle |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | oui | Base de l'API. Exposée au navigateur. |
| `NEXT_PUBLIC_SITE_URL` | `https://cabanedulys.ca` | oui | Base des métadonnées et liens canoniques. |

## Docker Compose (local)

`docker-compose.yml` fixe des valeurs de développement pour `db`, `redis`, `backend` et `frontend`.
Ne jamais réutiliser ces valeurs en production.

## Règles

- Un secret réel n'est jamais commité. Vérifier avec `git log -p -S "sk_live"` avant chaque release.
- En cas d'exposition, faire tourner la clé chez le fournisseur puis mettre à jour l'hébergeur.
- Les valeurs par défaut de `application.yml` sont volontairement reconnaissables (`replace_me`, `change_me`) pour échouer visiblement.
