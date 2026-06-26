import { Lys } from "@/components/ui/Lys";

const chips = ["Authenticité", "Échecs assumés", "Voix locales", "Zéro filtre", "Nouvelle génération"];

export function Manifeste() {
  return (
    <section id="manifeste" className="manifeste">
      <div className="container">
        <div className="divider" data-reveal style={{ marginBottom: "clamp(50px,8vw,90px)" }}><Lys /></div>
        <div className="manifeste-grid">
          <div className="manifeste-col" data-reveal>
            <span className="eyebrow" style={{ marginBottom: 24, display: "inline-flex" }}>Le Manifeste</span>
            <blockquote className="quote">
              <span className="mark">«</span>Internet t&apos;a vendu l&apos;<em>argent facile</em>. Ici, on te montre le travail, les nuits blanches et les vraies cicatrices.»
            </blockquote>
            <div className="tagchips">
              {chips.map((c) => <span key={c} className="chip">{c}</span>)}
            </div>
          </div>
          <div className="manifeste-col" data-reveal style={{ transitionDelay: ".12s" }}>
            <p className="body">La Cabane du Lys est une émission de podcast vidéo et audio dédiée à l&apos;entrepreneuriat et à la réalité brute du monde des affaires.</p>
            <p className="body">Née au cœur du Cégep de Saint-Félicien, sa mission est de démystifier l&apos;entrepreneuriat des réseaux sociaux et de contrer les fausses promesses d&apos;argent facile.</p>
            <p className="body">On donne la parole à des entrepreneurs, des dirigeants et des acteurs locaux pour qu&apos;ils partagent — en toute transparence — leurs parcours, leurs échecs et leurs réussites.</p>
            <p className="body">Épisodes longs sur YouTube, streaming audio, formats courts dynamiques : une direction artistique soignée au service d&apos;une ressource authentique et incontournable.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
