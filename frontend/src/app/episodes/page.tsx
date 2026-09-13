"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEpisodes } from "@/lib/queries";
import { publishedEpisodes as mockEpisodes } from "@/data/episodes";
import { withDevFallback } from "@/lib/fixtures";
import { formatTime } from "@/lib/utils";
import { PLATFORM_LINKS } from "@/lib/platforms";
import { ErrorState, Skeleton } from "@/components/ui/States";

export default function EpisodesPage() {
  const { data, isLoading, isError, refetch, isFetching } = useEpisodes();
  const episodes = withDevFallback(data, mockEpisodes, []);

  return (
    <div className="subpage">
      <div className="container">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Accueil</Link>
        <div className="page-head" data-reveal>
          <span className="eyebrow">Le Coffre</span>
          <h1 className="sec-title">Tous les <em>épisodes</em>.</h1>
          <p className="lead">
            {!isLoading && !isError && episodes.length === 0
              ? "Trois épisodes ont été tournés et sont en post-production. Rien n'est encore publié — abonnez-vous à la chaîne YouTube pour être averti au lancement."
              : "Le catalogue complet des conversations avec des entrepreneurs de la région."}
          </p>
        </div>

        {isLoading && <div style={{ marginTop: 48 }}><Skeleton lines={4} /></div>}

        {isError && <ErrorState detail="Le catalogue des épisodes est momentanément indisponible." onRetry={() => refetch()} retrying={isFetching} />}

        {!isLoading && !isError && episodes.length === 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <a href={PLATFORM_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="btn btn-solid">
              S&apos;abonner sur YouTube
            </a>
          </div>
        )}

        {!isLoading && !isError && episodes.length > 0 && (
          <div className="ep-grid" style={{ marginTop: 48 }}>
            {episodes.map((e, i) => (
              <Link
                key={e.id}
                href={`/episodes/${e.slug}`}
                className="ep-card"
                data-reveal
                style={{ transitionDelay: `${i * 0.06}s` }}
              >
                <div className="ep-num">Épisode {String(e.number).padStart(2, "0")}</div>
                <h4>{e.title}</h4>
                <p>{e.shortDescription ?? e.description}</p>
                <div className="ep-foot">
                  <span>{formatTime(e.durationSec)}</span>
                  <span className="go">Écouter <ArrowRight size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
