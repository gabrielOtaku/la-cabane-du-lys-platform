/**
 * Liens de diffusion réels — source unique utilisée par Coffre.tsx et Diffusion.tsx pour
 * éviter toute divergence (audit §8.4 : ne jamais avoir un href="#" en production).
 * Apple Podcasts : le compte n'est pas encore créé → `null` tant qu'il n'existe pas,
 * jamais de lien factice.
 */
export const PLATFORM_LINKS = {
  youtube: "https://www.youtube.com/@Lacabanedulys",
  spotify:
    "https://open.spotify.com/user/315bz2i23o2z7nuvkvd4vqckl3yu?si=6mjev8wuTRaO2NHg-kdnjw&utm_source=copy-link&sci=spotify%3Acard-config%3A5lruzIpcpbXkgl8M4nkivL",
  apple: null as string | null,
} as const;
