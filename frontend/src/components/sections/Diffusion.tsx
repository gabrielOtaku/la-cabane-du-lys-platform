import { Youtube, AudioLines, Smartphone, ArrowRight } from "lucide-react";

const channels = [
  { icon: <Youtube size={26} />, title: "YouTube", desc: "Les épisodes longs en vidéo, et les extraits marquants de chaque conversation.", cta: "S'abonner" },
  { icon: <AudioLines size={26} />, title: "Streaming Audio", desc: "Spotify, Apple Podcasts et toutes les plateformes. À écouter sur la route.", cta: "Écouter" },
  { icon: <Smartphone size={26} />, title: "Formats Courts", desc: "Reels, Shorts et TikTok : les punchs et les leçons en moins d'une minute.", cta: "Suivre" },
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
          {channels.map((c, i) => (
            <a key={c.title} className="diff-card" data-reveal style={{ transitionDelay: `${i * 0.08}s` }} href="#" target="_blank" rel="noopener">
              <div className="ic">{c.icon}</div>
              <h4>{c.title}</h4><p>{c.desc}</p>
              <span className="lk">{c.cta} <ArrowRight size={13} /></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
