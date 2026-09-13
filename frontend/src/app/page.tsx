import { Hero } from "@/components/sections/Hero";
import { Manifeste } from "@/components/sections/Manifeste";
import { Coffre } from "@/components/sections/Coffre";
import { Salle } from "@/components/sections/Salle";
import { Diffusion } from "@/components/sections/Diffusion";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { TiltEffects } from "@/components/layout/TiltEffects";

// Le Cercle et La Réserve sont masqués du site public (audit §P0) : leur flux
// d'authentification / paiement n'est pas prêt pour la production. Les composants
// restent dans le code (voir components/sections/Cercle.tsx et Reserve.tsx) pour la
// phase P3 une fois finalisés — cf. AUDIT_CHECKLIST.md.
export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifeste />
      <Coffre />
      <Salle />
      <Diffusion />
      <ScrollReveal />
      <TiltEffects />
    </>
  );
}
