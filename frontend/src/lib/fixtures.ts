/**
 * Fixtures de développement (feuille de route, phase 6) : l'API est la source de vérité.
 * En production, une API absente donne un état vide ou une erreur visible — jamais des
 * données locales affichées silencieusement comme si elles étaient réelles.
 */
export const DEV_FIXTURES = process.env.NODE_ENV !== "production";

export function withDevFallback<T>(data: T | undefined, fixture: T, empty: T): T {
  if (data !== undefined) return data;
  return DEV_FIXTURES ? fixture : empty;
}
