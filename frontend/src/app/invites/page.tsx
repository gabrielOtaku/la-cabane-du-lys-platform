"use client";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { useGuests } from "@/lib/queries";
import { guests as mockGuests } from "@/data/guests";
import { withDevFallback } from "@/lib/fixtures";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";

export default function InvitesPage() {
  const { data, isLoading, isError, refetch, isFetching } = useGuests();
  const guests = withDevFallback(data, mockGuests, []);

  return (
    <div className="subpage">
      <div className="container">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Accueil</Link>
        <div className="page-head" data-reveal>
          <span className="eyebrow">La Salle</span>
          <h1 className="sec-title">Les <em>invités</em>.</h1>
          <p className="lead">Des entrepreneurs que vous pouvez réellement croiser, comprendre et suivre dans leur progression.</p>
        </div>

        {isLoading && <div style={{ marginTop: 48 }}><Skeleton lines={4} /></div>}
        {isError && <ErrorState detail="La liste des invités est momentanément indisponible." onRetry={() => refetch()} retrying={isFetching} />}
        {!isLoading && !isError && guests.length === 0 && (
          <EmptyState title="Les premiers invités seront présentés à la publication du premier épisode." />
        )}

        {guests.length > 0 && (
          <div className="ep-grid" style={{ marginTop: 48 }}>
            {guests.map((g, i) => {
              const ancrage = [g.city, g.region].filter(Boolean).join(", ");
              return (
                <Link
                  key={g.id}
                  href={`/invites/${g.slug}`}
                  className="ep-card"
                  data-reveal
                  style={{ transitionDelay: `${i * 0.06}s` }}
                >
                  {g.category && <div className="ep-num">{g.category}</div>}
                  <h4>{g.name}</h4>
                  <p>{g.role}{g.company ? ` · ${g.company}` : ""}</p>
                  {ancrage && (
                    <div className="ep-foot">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={13} /> {ancrage}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
