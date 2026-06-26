import type { Sector } from "@/types";

/** Reliques 2D (icônes du corridor) — une silhouette par secteur. */
export function RelicIcon({ sector }: { sector: Sector }) {
  const common = { viewBox: "0 0 64 64" as const };
  switch (sector) {
    case "automobile":
      return (<svg {...common}><circle cx="32" cy="32" r="25" /><circle cx="32" cy="32" r="8" /><line x1="32" y1="40" x2="32" y2="57" /><line x1="26" y1="27" x2="12" y2="18" /><line x1="38" y1="27" x2="52" y2="18" /></svg>);
    case "tech":
      return (<svg {...common}><rect x="14" y="14" width="36" height="11" rx="2.5" /><rect x="14" y="27" width="36" height="11" rx="2.5" /><rect x="14" y="40" width="36" height="11" rx="2.5" /><line x1="42" y1="17" x2="42" y2="22" /><line x1="42" y1="30" x2="42" y2="35" /><line x1="42" y1="43" x2="42" y2="48" /></svg>);
    case "restauration":
      return (<svg {...common}><path d="M20 31 a8 8 0 0 1 -2 -15 a9 9 0 0 1 16 -4 a9 9 0 0 1 16 4 a8 8 0 0 1 -2 15 z" /><path d="M20 31 v17 h24 v-17" /><line x1="20" y1="40" x2="44" y2="40" /></svg>);
    case "construction":
      return (<svg {...common}><path d="M10 44 a22 22 0 0 1 44 0" /><line x1="6" y1="44" x2="58" y2="44" /><path d="M30 22 v-6 h4 v6" /></svg>);
    case "agroalimentaire":
    default:
      return (<svg {...common}><line x1="32" y1="57" x2="32" y2="16" /><path d="M32 22 q7 -3 9 -10 M32 22 q-7 -3 -9 -10 M32 31 q7 -3 9 -10 M32 31 q-7 -3 -9 -10 M32 40 q7 -3 9 -10 M32 40 q-7 -3 -9 -10 M32 16 q0 -6 0 -9" /></svg>);
  }
}

export const sectorLabel: Record<Sector, string> = {
  automobile: "Industrie automobile",
  tech: "Technologie",
  restauration: "Restauration",
  construction: "Construction",
  agroalimentaire: "Agroalimentaire",
};
