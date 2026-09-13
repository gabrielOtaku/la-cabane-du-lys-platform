import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { guests as mockGuests, getGuest } from "@/data/guests";
import { episodes as mockEpisodes } from "@/data/episodes";
import { api } from "@/lib/api";
import { DEV_FIXTURES } from "@/lib/fixtures";
import type { Guest, Episode } from "@/types";

export function generateStaticParams() {
  return mockGuests.map((g) => ({ slug: g.slug }));
}

async function resolveGuest(slug: string): Promise<Guest | undefined> {
  try {
    return await api.get<Guest>(`/guests/${slug}`);
  } catch {
    return DEV_FIXTURES ? getGuest(slug) : undefined;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await resolveGuest(slug);
  if (!g) return { title: "Invité introuvable · La Cabane du Lys" };
  return {
    title: `${g.name} · La Cabane du Lys`,
    description: g.angle ?? `${g.role} — ${g.company}`,
  };
}

export default async function GuestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await resolveGuest(slug);
  if (!g) notFound();

  let episodesData: Episode[];
  try {
    episodesData = await api.get<Episode[]>("/episodes");
  } catch {
    episodesData = DEV_FIXTURES ? mockEpisodes : [];
  }
  const linkedEpisode = episodesData.find((e) => e.guests.some((gu) => gu.slug === g.slug || gu.id === g.id));
  const episodeIsLive = linkedEpisode?.status === "PUBLISHED";
  const ancrage = [g.city, g.region].filter(Boolean).join(", ");

  return (
    <div className="subpage">
      <div className="ep-page ep-page-anim">
        <Link href="/invites" className="back-link"><ArrowLeft size={16} /> Tous les invités</Link>
        <div className="ep-hero">
          {g.category && <span className="eyebrow">{g.category}</span>}
          <h1>{g.name}</h1>
          <div className="ep-meta">
            {g.role}{g.company && <> · {g.company}</>}
            {ancrage && <> · {ancrage}</>}
          </div>
          {g.angle && <p className="ep-desc">{g.angle}</p>}
          {g.bio && <p className="ep-desc">{g.bio}</p>}
          {g.quote && <blockquote className="salle-quote">« {g.quote} »</blockquote>}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            {g.companyUrl && (
              <a href={g.companyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                {g.company} <ExternalLink size={14} />
              </a>
            )}
            {episodeIsLive ? (
              <Link href={`/episodes/${linkedEpisode!.slug}`} className="btn btn-solid">Voir l&apos;épisode</Link>
            ) : (
              <span className="btn btn-ghost" aria-disabled="true" style={{ opacity: 0.6, cursor: "default" }}>
                Épisode en post-production
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
