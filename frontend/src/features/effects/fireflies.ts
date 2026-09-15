/**
 * Lucioles (famille d'animation « Luciole », feuille de route §3) : petites lumières organiques
 * de courte durée émises au clic. Implémentation impérative et légère : quelques <span> dans un
 * calque fixe, animés en CSS, retirés du DOM à la fin de leur animation.
 */

export interface BurstOptions {
  /** Variante « Play » : les lucioles convergent vers ce point (centre de la waveform). */
  towards?: { x: number; y: number };
  /** Force le nombre de particules (sinon 6 à 9 selon la puissance de l'appareil). */
  count?: number;
}

const LAYER_ID = "firefly-layer";
const MAX_LIVE = 80;           // plafond de particules simultanées : jamais de fuite
const MIN_DURATION = 400;      // ms — bornes de la feuille de route
const MAX_DURATION = 800;

let layer: HTMLDivElement | null = null;

function getLayer(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  if (layer && layer.isConnected) return layer;
  const existing = document.getElementById(LAYER_ID) as HTMLDivElement | null;
  if (existing) { layer = existing; return layer; }
  const el = document.createElement("div");
  el.id = LAYER_ID;
  el.className = "firefly-layer";
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
  layer = el;
  return el;
}

function lowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  return cores <= 4 || memory <= 4;
}

/** Émet une salve de lucioles depuis (x, y) en coordonnées de la fenêtre. */
export function fireflyBurst(x: number, y: number, opts: BurstOptions = {}) {
  const host = getLayer();
  if (!host) return;
  if (host.childElementCount > MAX_LIVE) return;

  const count = opts.count ?? (lowPowerDevice() ? 6 : 6 + Math.floor(Math.random() * 4)); // 6..9
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.className = "firefly";

    const duration = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
    const size = 3 + Math.random() * 3;
    let dx: number;
    let dy: number;

    if (opts.towards) {
      // Convergence : chaque luciole parcourt 55 à 100 % du chemin, avec une légère dispersion.
      const reach = 0.55 + Math.random() * 0.45;
      const spread = 18;
      dx = (opts.towards.x - x) * reach + (Math.random() - 0.5) * spread;
      dy = (opts.towards.y - y) * reach + (Math.random() - 0.5) * spread;
      s.classList.add("converge");
    } else {
      // Dispersion organique : angle libre, distance 24 à 70 px, légère montée (chaleur).
      const angle = Math.random() * Math.PI * 2;
      const dist = 24 + Math.random() * 46;
      dx = Math.cos(angle) * dist;
      dy = Math.sin(angle) * dist - 10 - Math.random() * 14;
    }

    s.style.setProperty("--x", `${x}px`);
    s.style.setProperty("--y", `${y}px`);
    s.style.setProperty("--dx", `${dx.toFixed(1)}px`);
    s.style.setProperty("--dy", `${dy.toFixed(1)}px`);
    s.style.setProperty("--dur", `${Math.round(duration)}ms`);
    s.style.setProperty("--delay", `${Math.round(Math.random() * 60)}ms`);
    s.style.setProperty("--size", `${size.toFixed(1)}px`);
    s.style.setProperty("--wobble", `${((Math.random() - 0.5) * 16).toFixed(1)}px`);

    const remove = () => { s.remove(); };
    s.addEventListener("animationend", remove, { once: true });
    // Filet de sécurité si l'événement n'arrive pas (onglet caché, animation coupée).
    window.setTimeout(remove, duration + 200);

    fragment.appendChild(s);
  }

  host.appendChild(fragment);
}
