import { Youtube, AudioLines, Smartphone, ArrowRight } from "lucide-react";
import { PLATFORM_LINKS } from "@/lib/platforms";

const channels = [
  { icon: <Youtube size={26} />, title: "YouTube", desc: "Les épisodes longs en vidéo, et les extraits marquants de chaque conversation.", cta: "S'abonner", href: PLATFORM_LINKS.youtube },
  { icon: <AudioLines size={26} />, title: "Spotify", desc: "L'audio à écouter sur la route. Apple Podcasts suivra dès que le compte sera créé.", cta: "Écouter", href: PLATFORM_LINKS.spotify },
  { icon: <Smartphone size={26} />, title: "Formats Courts", desc: "Reels, Shorts et TikTok : les punchs et les leçons en moins d'une minute.", cta: "Bientôt disponible", href: null as string | null },
];

export function Diffusion() {
  return (
    <section id="diffusion" className="diffusion">
      <div className="container">
        <div className="sec-head" data-reveal style={{ maxWidth: "none", alignItems: "flex-start" }}>
          <span className="eyebrow">Diffusion</span>
          <h2 className="sec-title">Où nous <em>écouter</em>.</h2>
        </div>
        <div className="diff-grid">
          {channels.map((c, i) =>
            c.href ? (
              <a
                key={c.title}
                className="diff-card"
                data-reveal
                style={{ transitionDelay: `${i * 0.08}s` }}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="ic">{c.icon}</div>
                <h4>{c.title}</h4><p>{c.desc}</p>
                <span className="lk">{c.cta} <ArrowRight size={13} /></span>
              </a>
            ) : (
              <div
                key={c.title}
                className="diff-card diff-card--disabled"
                data-reveal
                style={{ transitionDelay: `${i * 0.08}s`, opacity: 0.6, cursor: "default" }}
                aria-disabled="true"
              >
                <div className="ic">{c.icon}</div>
                <h4>{c.title}</h4><p>{c.desc}</p>
                <span className="lk">{c.cta}</span>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
