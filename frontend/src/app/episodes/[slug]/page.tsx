import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { publishedEpisodes, getEpisode } from "@/data/episodes";
import { EpisodePlayer } from "@/components/sections/EpisodePlayer";
import { api } from "@/lib/api";
import { DEV_FIXTURES } from "@/lib/fixtures";
import type { Episode } from "@/types";

// SSG pour les épisodes déjà publiés au moment du build. Next 15 gère les autres slugs
// dynamiquement à la requête (dynamicParams reste à true par défaut).
export function generateStaticParams() {
  return publishedEpisodes.map((e) => ({ slug: e.slug }));
}

async function resolveEpisode(slug: string): Promise<Episode | undefined> {
  try {
    return await api.get<Episode>(`/episodes/${slug}`);
  } catch {
    // Fixture locale en développement seulement ; en production une API absente donne un 404
    // honnête. Le backend ne retourne jamais un DRAFT : le filtre ci-dessous reste la seule garde.
    return DEV_FIXTURES ? getEpisode(slug) : undefined;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ep = await resolveEpisode(slug);
  if (!ep || ep.status !== "PUBLISHED") return { title: "Épisode introuvable · La Cabane du Lys" };
  return {
    title: `Épisode ${ep.number} — ${ep.title} · La Cabane du Lys`,
    description: ep.shortDescription ?? ep.description,
  };
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ep = await resolveEpisode(slug);

  // Un épisode DRAFT (en post-production) n'est jamais accessible publiquement, même par URL directe.
  if (!ep || ep.status !== "PUBLISHED") notFound();

  const guestNames = ep.guests.map((g) => g.name).join(" & ");

  return (
    <div className="subpage">
      <div className="ep-page ep-page-anim">
        <Link href="/episodes" className="back-link"><ArrowLeft size={16} /> Tous les épisodes</Link>
        <div className="ep-hero">
          <span className="eyebrow">Épisode {String(ep.number).padStart(2, "0")}</span>
          <h1>{ep.title}</h1>
          <div className="ep-meta">
            Avec {guestNames}
            {ep.publishedAt && (
              <> · Publié le {new Date(ep.publishedAt).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}</>
            )}
          </div>
          <p className="ep-desc">{ep.description ?? ep.shortDescription}</p>
        </div>
        <EpisodePlayer episode={ep} />
      </div>
    </div>
  );
}
