import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { episodes, getEpisode } from "@/data/episodes";
import { sectorLabel } from "@/components/ui/RelicIcon";
import { EpisodePlayer } from "@/components/sections/EpisodePlayer";

// SSG : pré-génère une page par épisode (performance d'élite, cf. cahier des charges §3.1).
export function generateStaticParams() {
  return episodes.map((e) => ({ id: e.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const ep = getEpisode(params.id);
  return { title: ep ? `Épisode ${ep.number} — ${ep.title} · La Cabane du Lys` : "Épisode introuvable" };
}

export default function EpisodePage({ params }: { params: { id: string } }) {
  const ep = getEpisode(params.id);
  if (!ep) notFound();

  return (
    <div className="subpage">
      <div className="ep-page ep-page-anim">
        <Link href="/#coffre" className="back-link"><ArrowLeft size={16} /> Tous les épisodes</Link>
        <div className="ep-hero">
          <span className="eyebrow">Épisode {String(ep.number).padStart(2, "0")} · {sectorLabel[ep.sector]}</span>
          <h1>{ep.title}</h1>
          <div className="ep-meta">Avec {ep.guestName} · Publié le {new Date(ep.publishedAt).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}</div>
          <p className="ep-desc">{ep.description}</p>
        </div>
        <EpisodePlayer episode={ep} />
      </div>
    </div>
  );
}
