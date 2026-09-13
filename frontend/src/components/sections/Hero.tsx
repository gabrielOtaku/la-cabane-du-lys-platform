import { Play, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Lys } from "@/components/ui/Lys";
import { ScrollLink } from "@/components/ui/ScrollLink";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { HeroProof } from "./HeroProof";

/**
 * Hero V2 (feuille de route, phase 5) : ce que propose la plateforme, à qui, et quoi faire —
 * en quelques secondes. Un appel principal (écouter), un appel secondaire (parcourir).
 */
export function Hero() {
  return (
    <section id="edifice" className="hero" aria-labelledby="hero-title">
      <Lys className="hero-lys" />
      <div className="container">
        <span className="eyebrow hero-eyebrow" data-reveal>Podcast entrepreneurial — Saint-Félicien, Québec</span>
        <h1 id="hero-title" className="display" data-reveal style={{ transitionDelay: ".08s" }}>
          La vérité <em>brute</em><br />de l&apos;entrepreneuriat.
        </h1>
        <div className="hero-sub" data-reveal style={{ transitionDelay: ".16s" }}>
          <p className="lead">
            Des entrepreneurs d&apos;ici racontent ce qu&apos;il faut vraiment pour bâtir : les débuts,
            les doutes, les décisions. Sans promesse d&apos;argent facile.
          </p>
        </div>
        <div className="hero-actions" data-reveal style={{ transitionDelay: ".24s" }}>
          <MagneticButton>
            <ScrollLink to="#coffre" className="btn btn-solid">
              <Play size={18} fill="currentColor" /> Écouter un extrait
            </ScrollLink>
          </MagneticButton>
          <MagneticButton>
            <Link href="/invites" className="btn btn-ghost">
              Rencontrer les invités <ArrowRight size={16} />
            </Link>
          </MagneticButton>
        </div>
      </div>
      <div className="scroll-cue" aria-hidden="true"><span>Défiler</span><i /></div>
      <HeroProof />
    </section>
  );
}
