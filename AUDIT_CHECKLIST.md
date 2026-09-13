# Checklist de suivi — Audit & Cahier des charges 2026

> Source : `Audit_Cahier_des_charges_La_Cabane_du_Lys_2026.pdf`, version 1.0, 19 août 2026.
> Ce fichier sert de tableau de bord vivant. Chaque case cochée = validé et vérifié dans le code, pas seulement discuté.
> Mettre à jour ce fichier à chaque session de travail sur le projet.

Légende : `[ ]` à faire · `[~]` en cours / partiel · `[x]` fait et vérifié (build/type-check passés)

---

## P0 — Avant toute mise en ligne publique

### Contenu
- [x] Retirer tous les invités/entreprises/citations/CA fictifs (`frontend/src/data/guests.ts`, `V1__init.sql` neutralisé par `V4__real_content_and_multi_guest.sql`)
- [x] Retirer tous les épisodes/transcriptions fictifs (idem, `frontend/src/data/episodes.ts`)
- [x] Retirer les compteurs sociaux fictifs (`social_stats` remis à 0 dans V4)
- [~] Créer les 3 fiches invités réelles — infos validées (Annexe A) + bios sourcées des sites officiels (matsheshucreations.com, shampoingauto.com, web-icom.com) intégrées ; nom complet de Corentin confirmé (**Corentin Guyon**, technicien & installateur) ; **photos toujours manquantes — non fournies par les invités, y compris pour les vidéos**
- [~] Créer les épisodes réels correspondants — 3 épisodes créés en statut `DRAFT` (tournés, en post-production) ; **aucune date/durée/lien vidéo tant qu'ils ne sont pas publiés** — à compléter à la sortie réelle
- [x] Aucune donnée financière (CA/revenu/salaire) affichée par défaut — champs supprimés du modèle, pas juste cachés

### Modèle de données
- [x] Modèle multi-invités par épisode (table `episode_guests`, `@ManyToMany` + `@OrderColumn`)
- [x] Slugs stables et humains pour épisodes et invités (uniques en DB, repli UUID)
- [x] Aligner `Guest`/`Episode` front avec les DTO back (`GuestSummaryDto` imbriqué, taxonomie `category` libre)

### Bug critique routing
- [x] Corriger `frontend/src/app/episodes/[slug]/page.tsx` (renommé depuis `[id]`) : lecture par slug via API, repli mock, jamais un DRAFT exposé
- [x] Routes dynamiques en `params: Promise` + `await` (Next.js 15)
- [x] `generateStaticParams` limité aux épisodes publiés (0 pour l'instant — normal, aucun épisode publié)
- [x] Mettre à jour README/package.json (mentions Next 14 → 15.5.19) — README réécrit le 2026-09-12 (versions réelles, commandes, API)

### Navigation & pages publiques
- [x] Créer `/episodes` (liste + repli mock)
- [x] Créer `/episodes/[slug]` (détail, 404 si DRAFT ou introuvable)
- [x] Créer `/invites` (répertoire)
- [x] Créer `/invites/[slug]` (fiche parcours, SSG sur les 4 invités réels)
- [x] Créer `/a-propos`
- [x] Créer `/participer` (formulaire → mailto, pas de fausse confirmation)
- [x] Créer `/contact`
- [ ] Créer `/confidentialite`
- [x] Nouvelle nav principale avec routes réelles (Header.tsx : Épisodes / Invités / À propos / Participer / Contact)
- [x] Masquer `/login`, `/drop`, `/hall-of-fame` de la navigation publique (aucun lien pointant vers ces routes)

### Accueil
- [x] Masquer Cercle et Réserve du rendu public (retirés de `page.tsx`, composants conservés pour P3)
- [x] CTA Hero : « Voir le dernier épisode » (ancre Coffre) + « Découvrir tous les épisodes » (`/episodes`)
- [ ] Raccourcir le Manifeste sur l'accueil à 2-3 paragraphes (version actuelle à 4 paragraphes conservée telle quelle)
- [ ] Ajouter les sections « Ce que l'on explore » et « Participer » à l'accueil (§5.1)

### Diffusion / liens
- [x] `Diffusion.tsx` : YouTube et Spotify réels (fournis par l'utilisateur), Apple Podcasts masqué (compte non créé) au lieu d'un `href="#"`
- [x] Contradiction public vs Cercle résolue dans `Coffre.tsx` : plus de mur « Rejoindre le Cercle », le relais après l'extrait pointe vers les vraies plateformes

### Sécurité — magic link / auth
- [x] Lien magique **réel** depuis le 2026-09-12 (`MagicLinkService`) : jeton aléatoire à usage unique, hachage SHA-256 en base, expiration 15 min, courriel (`MAIL_MODE=smtp`, `log` en dev), callback `/login/callback`, réponse identique pour toute adresse. Le flag `magic-link-enabled` reste un interrupteur d'urgence (défaut : activé).
- [x] Session en cookie HttpOnly · Secure · SameSite=Lax, révocation à la déconnexion, 401/403 JSON, vérification d'origine anti-CSRF (`JwtAuthenticationFilter`) — tests `AuthFlowTest`
- [x] Fallback `membre@cabanedulys.ca` retiré de `/login` **et** de `Cercle.tsx` (branché sur le vrai flux)
- [x] Promesses marketing absolues retirées (« conforme niveau bancaire », « aucune fuite possible »)
- [x] Rate limiting étendu aux 4 endpoints WebAuthn (`RateLimitFilter`)
- [x] `X-Forwarded-For` ignoré par défaut, n'est lu que si `app.rate-limit.trust-forwarded-for=true`
- [x] `JwtAuthenticationFilter` utilise le rôle réel du jeton (`ROLE_<role>`) au lieu de `ROLE_MEMBER` codé en dur
- [x] Enregistrement WebAuthn réservé à une session ouverte (adresse vérifiée par lien magique) ; aucun compte créé par ce chemin
- [x] Enchaînement automatique `login()` → `register()` retiré ; connexion par passkey sans courriel (`challengeId`, pas d'énumération)

### Boutique
- [x] Teaser « La Réserve » retiré de l'accueil public
- [x] `/drop` branché sur l'API réelle : sans drop publié, la page affiche honnêtement « Aucun drop programmé » (plus de date inventée)

### SEO minimum
- [ ] favicon, icon, apple-icon
- [ ] canonical + Open Graph globaux
- [ ] Twitter/X card
- [ ] `robots.ts` et `sitemap.ts`
- [ ] Image de partage 1200x630
- [ ] Métadonnées dynamiques par épisode/invité (base posée : `generateMetadata` déjà en place sur `/episodes/[slug]` et `/invites/[slug]`, à enrichir avec OG)

### Accessibilité
- [x] Menu burger : `aria-expanded`, `aria-controls`, Escape, focus trap, retour du focus, fermeture au changement de route
- [x] `:focus-visible` cohérent (règle globale dans `styles/v2.css`) + état actif de navigation (`aria-current`)
- [x] Lien « Aller au contenu » en début de page (`#contenu`)
- [~] `prefers-reduced-motion` : curseur, lucioles, waveform, transitions de page et mini lecteur respectés — Hall 3D et EmberField restent à traiter

### Performance
- [ ] Réduire/limiter le préloader
- [ ] Limiter EmberField (WebGL global) au Hero, pause hors-écran/onglet caché, qualité mobile réduite

### Légal
- [ ] Politique de confidentialité pour formulaires/analytics (page `/confidentialite`)

### Correctif hors audit, découvert et corrigé cette session
- [x] `frontend/src/app/layout.tsx` : l'import de `globals.css` était commenté — dé-commenté (site sans styles sinon)
- [x] `useWebAuthn.ts` : 5 `any` non typés faisaient échouer `next build` (ESLint) — typés proprement, build de prod vérifié vert

---

## P1 — Premières semaines après lancement
- [ ] Chapitres et transcriptions réelles par épisode
- [ ] Fiches invité détaillées avec liens externes (structure prête, contenu à enrichir)
- [x] Formulaire "Proposer un invité" (`/participer`, champs §14.4, via mailto — pas de backend de stockage)
- [ ] Formulaire "Rejoindre l'équipe" dédié (actuellement fusionné avec Participer)
- [ ] Analytics respectueux de la vie privée + Search Console
- [ ] Recherche interne réelle (le hook `useEpisodeSearch` existe déjà côté front/back, à valider en conditions réelles)
- [ ] Optimisation images (`next/image`, AVIF/WebP) + monitoring Core Web Vitals
- [ ] Page `/partenaires`
- [ ] Kit média / dossier du podcast
- [ ] Aligner `backend/Dockerfile` (Temurin 25 → 21)

---

## P2 — Croissance
- [ ] Newsletter avec stratégie éditoriale réelle
- [ ] Espace administration/CMS
- [ ] Recommandations d'épisodes liés
- [ ] Automatisation partielle des stats plateformes (avec sources)
- [ ] Espace ressources / apprentissages

---

## P3 — Expériences avancées (reporté, pas un prérequis)
- [ ] Cercle membre avec valeur claire + auth finalisée
- [ ] Passkeys/WebAuthn durcies et testées (voir détail sécurité ci-dessous)
- [ ] Boutique/drops Stripe complète (stock, webhooks idempotents, page succès, opérations)
- [ ] Hall of Fame 3D enrichi + fallback accessible
- [ ] Expériences communautaires avancées

### Détail sécurité WebAuthn restant (P3)
- [x] Enregistrement : session vérifiée requise (lien magique) — fait 2026-09-12
- [x] Front : plus d'enchaînement `login()` → `register()` — fait 2026-09-12
- [x] Stratégie unique retenue : cookie HttpOnly/Secure/SameSite + vérification d'origine (le corps des réponses ne contient plus de jeton) — fait 2026-09-12
- [x] `JwtAuthenticationFilter` utilise le rôle réel du jeton — fait cette session
- [x] Rate limiting étendu aux endpoints WebAuthn — fait cette session
- [x] `X-Forwarded-For` derrière proxy de confiance uniquement — fait cette session

### Détail boutique (P3)
- [x] Date du drop réelle en base (entité `Drop`, migration V6) — fait 2026-09-12
- [x] Checkout front branché sur `useCheckout` → Stripe Checkout (connexion requise) — fait 2026-09-12
- [x] Page `/drop/success` créée (suivi de l'état de commande) — fait 2026-09-12
- [x] Réservation de stock avant paiement (verrou de ligne, expiration, limite par client) — tests `ShopReservationTest`
- [x] Webhook idempotent (`stripe_events`) + vérification du montant — tests `ShopWebhookControllerTest`
- [x] Commande liée à l'utilisateur de la session
- [ ] Règles opérationnelles définies (livraison, taxes, remboursements, emails, inventaire) — décision éditoriale/administrative

---

## Matrice fichiers → priorité (référence rapide)

| Fichier | Priorité | Statut |
|---|---|---|
| `frontend/src/app/layout.tsx` | P0 | `[~]` CSS corrigé ; OG/canonical/sitemap restent |
| `frontend/src/app/episodes/[slug]/page.tsx` | P0 | `[x]` |
| `frontend/src/components/sections/Coffre.tsx` | P0 | `[x]` |
| `frontend/src/components/sections/Salle.tsx` | P0 | `[x]` |
| `frontend/src/components/sections/Diffusion.tsx` | P0 | `[x]` |
| `frontend/src/components/sections/Cercle.tsx` | P0/P3 | `[~]` masqué de l'accueil, code interne non nettoyé |
| `frontend/src/app/(auth)/login/page.tsx` | P0/P3 | `[~]` fallback/claims retirés, flow réel encore à finaliser |
| `frontend/src/app/(shop)/drop/page.tsx` | P3 | `[ ]` |
| `frontend/src/data/*.ts` | P0 | `[x]` |
| `frontend/src/types/index.ts` | P0 | `[x]` |
| `frontend/src/lib/api.ts` | P0/P3 | `[ ]` toujours pas d'`Authorization: Bearer` envoyé |
| `backend/.../AuthService.java` | P0/P3 | `[~]` magic-link neutralisé ; vérification email WebAuthn restante |
| `backend/.../JwtAuthenticationFilter.java` | P3 | `[x]` |
| `backend/.../RateLimitFilter.java` | P3 | `[x]` |
| `backend/.../ShopService.java` | P3 | `[ ]` |
| `backend/resources/db/migration/V1__init.sql` | P0 | `[x]` neutralisé par V4 (données supprimées en DB, historique Flyway préservé) |
| `backend/resources/db/migration/V3__add_search_and_stats.sql` | P0 | `[x]` idem |
| `backend/Dockerfile` | P1 | `[ ]` |
| `README.md` | P0 | `[ ]` |

---

## Checklist finale de mise en ligne (section 19 de l'audit)

- [~] Les seuls invités visibles sont réels — approbation promotionnelle encore à obtenir
- [x] Aucun chiffre d'affaires privé ou estimé n'est publié sans consentement
- [x] Aucun nom, citation ou entreprise fictive n'apparaît sur le site public
- [ ] Le dernier épisode ouvre réellement la bonne vidéo/page (aucun épisode publié pour l'instant)
- [~] Liens YouTube/Spotify testés (fournis par l'utilisateur) ; Apple masqué tant qu'il n'existe pas
- [x] Le site fonctionne sans backend ou affiche une vraie erreur — jamais de données fictives en prod
- [x] Le magic-link démo est désactivé (503 par défaut)
- [~] Les routes `/login` et `/drop` sont masquées de la nav — restent accessibles par URL directe
- [~] Le menu fonctionne au clavier — aria ajouté, Escape/focus trap manquants
- [ ] Le site respecte `prefers-reduced-motion` partout
- [ ] Le Hall 3D a une alternative HTML accessible
- [ ] Favicon, OG image, sitemap, robots, title et description en place
- [~] Chaque épisode a un slug et une description — SEO par épisode (OG dynamique) à compléter
- [ ] Analytics et formulaires couverts par une politique de confidentialité
- [x] Les variables de prod n'utilisent aucun secret par défaut nouvellement introduit (flags magic-link/XFF sûrs par défaut)
- [ ] Base de données et Redis ne sont pas exposés publiquement sans nécessité (à vérifier en config de déploiement réelle)
- [ ] Site testé sur mobile réel, Chrome, Firefox/Safari
- [ ] Lighthouse/Core Web Vitals mesurés après ajout des vrais médias
- [ ] Sauvegarde DB et procédure de rollback existent avant lancement

---

## Journal de progression

| Date | Élément(s) traité(s) | Notes |
|---|---|---|
| 2026-08-20 | Création de ce fichier de suivi | Basé sur l'audit v1.0 du 19 août 2026 |
| 2026-08-20 | Sécurité backend : magic-link désactivé par défaut, rôle JWT réel, rate limiting WebAuthn, XFF de confiance | Backend compile (`mvn -o compile` vert) |
| 2026-08-20 | Modèle multi-invités + slugs (migration V4, entités, DTO, repos, services, contrôleurs) | 3 invités réels + 3 épisodes DRAFT seedés, données fictives supprimées de la DB |
| 2026-08-20 | Frontend : types, données, routing `/episodes/[slug]`, Coffre/Salle/Diffusion réécrits, nav réelle, Cercle/Réserve masqués, 6 nouvelles pages créées | `npm run build` vert (16 routes, type-check + lint passés) |
| 2026-08-20 | Confirmations reçues : lien Spotify = profil personnel voulu (OK) ; email de contact réel = lacabanedulys@gmail.com (mis à jour dans /contact et /participer) ; bios sourcées des sites officiels via WebFetch, nom complet de Corentin confirmé (Corentin Guyon) | Photos toujours absentes (non fournies par les invités) — `photoUrl` reste vide, pas de visuel générique. Favicon/image OG toujours à faire (SEO). Build backend + frontend revalidés verts après ces changements. |
| 2026-09-12 | Feuille de route V2, phases 0 à 4 (+ début 5/6) sur la branche `v2` : lien magique réel + cookie HttpOnly + rôles + CSRF ; entité Drop, réservation de stock, webhooks idempotents ; moteur audio unique + mini lecteur + transcription ; curseur fleur de lys + lucioles ; Hero V2 avec preuves réelles ; fixtures limitées au dev ; états d'interface | Suivi détaillé : `docs/ROADMAP_STATUS.md`. 32 tests backend verts (H2), `npm run build` vert (18 routes). Java 21 conservé (Boot 3.2.5 non compatible Java 25). Un run Copilot « Java upgrade » a auto-stashé le travail d'août en cours de session : restauré via `git stash apply`, le stash est conservé en sauvegarde. |
