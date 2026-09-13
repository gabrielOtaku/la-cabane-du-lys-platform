import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Lys } from "@/components/ui/Lys";

export const metadata = {
  title: "À propos · La Cabane du Lys",
  description: "L'histoire, la mission et la ligne éditoriale du podcast La Cabane du Lys.",
};

export default function AboutPage() {
  return (
    <div className="subpage">
      <div className="container">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Accueil</Link>
        <div className="page-head" data-reveal>
          <span className="eyebrow">Le Manifeste</span>
          <h1 className="sec-title">Donner la parole à celles et ceux<br /><em>qui entreprennent vraiment, ici.</em></h1>
        </div>

        <div className="divider" data-reveal style={{ margin: "clamp(40px,6vw,72px) auto" }}><Lys /></div>

        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p className="body">
            La Cabane du Lys est une émission de podcast vidéo et audio dédiée à l&apos;entrepreneuriat et à la
            réalité brute du monde des affaires.
          </p>
          <p className="body">
            Née au cœur du Cégep de Saint-Félicien, sa mission est de démystifier l&apos;entrepreneuriat des
            réseaux sociaux et de contrer les fausses promesses d&apos;argent facile.
          </p>
          <p className="body">
            On donne la parole à des entrepreneurs, des dirigeants et des acteurs locaux pour qu&apos;ils
            partagent — en toute transparence — leurs parcours, leurs échecs et leurs réussites. Découvrir des
            entrepreneurs accessibles, notamment de la région : premiers clients, premières ventes, erreurs,
            financement limité et progression réelle.
          </p>
          <p className="body">
            Épisodes longs sur YouTube, streaming audio, formats courts dynamiques : une direction artistique
            soignée au service d&apos;une ressource authentique et incontournable pour le Saguenay-Lac-Saint-Jean.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 40 }}>
            <Link href="/episodes" className="btn btn-solid">Voir les épisodes</Link>
            <Link href="/participer" className="btn btn-ghost">Participer au projet</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
