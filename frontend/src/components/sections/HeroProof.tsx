"use client";
import { useEpisodes, useGuests } from "@/lib/queries";
import { withDevFallback } from "@/lib/fixtures";
import { publishedEpisodes as mockEpisodes } from "@/data/episodes";
import { guests as mockGuests } from "@/data/guests";

/**
 * Bandeau de preuves du Hero (feuille de route, phase 5) : des chiffres vérifiables, jamais
 * de promesse générique. Tant qu'aucun épisode n'est publié, seules les preuves réelles
 * (entrepreneurs rencontrés, ancrage) sont affichées.
 */
export function HeroProof() {
  const { data: episodesData } = useEpisodes();
  const { data: guestsData } = useGuests();
  const episodes = withDevFallback(episodesData, mockEpisodes, []);
  const guests = withDevFallback(guestsData, mockGuests, []);

  const published = episodes.filter((e) => e.status === "PUBLISHED");
  const hours = published.reduce((acc, e) => acc + (e.durationSec || 0), 0) / 3600;

  const items: { value: string; label: string }[] = [];
  if (published.length > 0) items.push({ value: String(published.length), label: published.length > 1 ? "Épisodes publiés" : "Épisode publié" });
  if (guests.length > 0) items.push({ value: String(guests.length), label: guests.length > 1 ? "Entrepreneurs rencontrés" : "Entrepreneur rencontré" });
  if (hours >= 1) items.push({ value: `${Math.floor(hours)} h`, label: "De conversation" });
  items.push({ value: "Saint-Félicien", label: "Vers la francophonie" });
  if (items.length < 4) items.push({ value: "0", label: "Promesse d'argent facile" });

  return (
    <div className="hero-stats">
      <div className="container">
        {items.slice(0, 4).map((it, i) => (
          <div key={it.label} className="hstat" data-reveal style={{ transitionDelay: `${i * 0.08}s` }}>
            <b>{it.value}</b><span>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
