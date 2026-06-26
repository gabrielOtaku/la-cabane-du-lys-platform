import { Play, ArrowRight } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { ScrollLink } from "@/components/ui/ScrollLink";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function Hero() {
  return (
    <section id="edifice" className="hero">
      <Lys className="hero-lys" />
      <div className="container">
        <span className="eyebrow hero-eyebrow" data-reveal>Podcast Vidéo &amp; Audio — Saint-Félicien, Québec</span>
        <h1 className="display" data-reveal style={{ transitionDelay: ".08s" }}>
          La vérité <em>brute</em><br />de l&apos;entrepreneuriat.
        </h1>
        <div className="hero-sub" data-reveal style={{ transitionDelay: ".16s" }}>
          <p className="lead">Pas de promesses d&apos;argent facile. Que des parcours réels — les échecs, les doutes et ce qu&apos;il faut vraiment pour bâtir.</p>
        </div>
        <div className="hero-actions" data-reveal style={{ transitionDelay: ".24s" }}>
          <MagneticButton>
            <ScrollLink to="#coffre" className="btn btn-solid">
              <Play size={18} fill="currentColor" /> Écouter le dernier épisode
            </ScrollLink>
          </MagneticButton>
          <MagneticButton>
            <ScrollLink to="#cercle" className="btn btn-ghost">
              Entrer dans le Cercle <ArrowRight size={16} />
            </ScrollLink>
          </MagneticButton>
        </div>
      </div>
      <div className="scroll-cue"><span>Défiler</span><i /></div>
      <div className="hero-stats">
        <div className="container">
          <div className="hstat" data-reveal><b>100%</b><span>Transparence</span></div>
          <div className="hstat" data-reveal style={{ transitionDelay: ".08s" }}><b>0</b><span>Promesse facile</span></div>
          <div className="hstat" data-reveal style={{ transitionDelay: ".16s" }}><b>Cégep</b><span>Le berceau</span></div>
          <div className="hstat" data-reveal style={{ transitionDelay: ".24s" }}><b>∞</b><span>Leçons réelles</span></div>
        </div>
      </div>
    </section>
  );
}
