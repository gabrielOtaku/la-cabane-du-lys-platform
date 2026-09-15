# Direction artistique — guide de travail (V2)

> Feuille de route du 13 septembre 2026, §3 et phase 5. Ce guide dit **où** chaque décision vit dans le code,
> pour que la cohérence se vérifie en relisant deux fichiers plutôt qu'en devinant.

## Positionnement

Maison éditoriale entrepreneuriale francophone. Atmosphère sombre et chaleureuse, mais lisible comme un
magazine documentaire premium. Les effets servent le récit, l'écoute et la lecture ; un effet sans fonction
est retiré.

## Tokens — `frontend/src/styles/base/tokens.css`

| Famille | Tokens | Usage |
| --- | --- | --- |
| Couleur | `--bg`, `--panel`, `--bronze`, `--gold`, `--amber`, `--ember`, `--cream`, `--smoke` | Palette Obsidienne · Bronze · Ambre. Le feu (`--amber`, `--ember`) est réservé à l'audio et aux interactions. |
| Culture · matière | `--terre`, `--terre-2` | Madagascar : terre rouge profonde, textures tissées abstraites (trame du Manifeste), jamais de motif culturel littéral. |
| Culture · territoire | `--brume`, `--hiver` | Québec : brume et lumière hivernale (voile de La Salle), fleur de lys, forêt boréale, mention de Saint-Félicien. |
| Culture · éditorial | typographie `--serif` / `--sans`, `.quote`, `.eyebrow`, marges `--maxw` | France : composition de maison d'édition — grandes citations, chapitres, marges généreuses. |
| Espace | `--space-1` … `--space-7` | Échelle 4 · 8 · 12 · 18 · 28 · 44 · 72 px. |
| Rayons | `--radius-s/m/l/pill` | 3 · 8 · 18 px · pilule. |
| Verre fumé | `--glass-bg`, `--glass-blur`, `--glass-border` | rgba(15, 13, 10, .62), flou 24 px, filet bronze discret (règles visuelles §3). |
| Mouvement | `--motion-fast/standard/organic/engrave`, `--ease-standard`, `--glow-low/active` | Voir les familles ci-dessous. |
| Couches | `--z-*` | Un seul endroit pour l'ordre d'empilement : nav, mini lecteur, loader, toast, curseur, lucioles. |

## Trois familles d'animation — et rien d'autre

| Famille | Fichier | Déclencheur | Comportement |
| --- | --- | --- | --- |
| **Braise** | `styles/audio.css`, `features/audio/WaveformVisualizer.tsx` | Lecture audio | Waveform, playhead, progression et étincelles pilotés par l'intensité sonore réelle. Le feu est *dans* le lecteur, jamais autour de la carte. |
| **Luciole** | `styles/cursor.css`, `features/effects/fireflies.ts` | Clic, interaction | 6 à 9 lumières organiques, 400 à 800 ms, trajectoires variées, disparition douce. Variante Play : convergence vers la waveform. |
| **Gravure & dorure** | `styles/gravure.css` | Arrivée d'un titre à l'écran (`[data-reveal].in`) | La ligne de l'eyebrow se trace (900 ms) ; un seul reflet bronze traverse le mot italique du titre, puis se fige. |

Règles : une animation appartient à une famille ou n'existe pas. Aucune boucle décorative indépendante.
`prefers-reduced-motion` neutralise les trois familles (curseur natif, waveform statique, titres figés).

## Règles visuelles appliquées

- Verre fumé : `--glass-*` (mini lecteur, boîtes d'état). Pas de bordure lumineuse autour du lecteur : un filet bronze.
- 3D réservée aux moments qui servent la marque (Hall of Fame) ; le champ de braises se met en pause hors du Hero et onglet caché.
- Pas de collage de drapeaux ni de symboles répétés : la fleur de lys est l'unique emblème (curseur, sceau, loader).
- Contraste : texte courant `--cream` sur `--bg` (AA), `--smoke` réservé aux libellés secondaires.

## Hero et preuves

Le Hero répond en quelques secondes à trois questions : quoi (podcast entrepreneurial), pour qui (celles et ceux
qui bâtissent, d'ici vers la francophonie), quoi faire (écouter un extrait, rencontrer les invités).
Le bandeau de preuves (`components/sections/HeroProof.tsx`) n'affiche que des chiffres vérifiables issus de
l'API : épisodes publiés, entrepreneurs rencontrés, heures de conversation, ancrage Saint-Félicien.

## Où ajouter un style

- Nouvelle section de page : `styles/base/<section>.css`, importée dans l'ordre depuis `app/layout.tsx`.
- Nouveau composant transversal : `styles/v2.css` (états, boutons, accessibilité) ou un fichier dédié par famille.
- Jamais dans `app/globals.css` : il ne contient que les directives Tailwind et la table des matières.
