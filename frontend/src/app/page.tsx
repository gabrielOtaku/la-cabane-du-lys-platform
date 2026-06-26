import { Hero } from "@/components/sections/Hero";
import { Manifeste } from "@/components/sections/Manifeste";
import { Coffre } from "@/components/sections/Coffre";
import { Salle } from "@/components/sections/Salle";
import { Cercle } from "@/components/sections/Cercle";
import { Reserve } from "@/components/sections/Reserve";
import { Diffusion } from "@/components/sections/Diffusion";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { TiltEffects } from "@/components/layout/TiltEffects";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifeste />
      <Coffre />
      <Salle />
      <Cercle />
      <Reserve />
      <Diffusion />
      <ScrollReveal />
      <TiltEffects />
    </>
  );
}
