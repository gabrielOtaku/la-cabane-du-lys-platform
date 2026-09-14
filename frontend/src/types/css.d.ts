/**
 * Déclarations pour les imports CSS à effet de bord (globals.css, styles/*.css).
 * Next.js les gère au bundling ; TypeScript 5.6+ (noUncheckedSideEffectImports) et le serveur
 * de langage de l'IDE ont besoin de cette déclaration pour ne pas signaler ts(2882).
 */
declare module "*.css";
