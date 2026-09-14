"use client";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { when } from "@/components/admin/Form";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useAdminOverview, useAuditLog } from "@/lib/admin";

export default function AdminOverviewPage() {
  const overview = useAdminOverview();
  const audit = useAuditLog(8);

  return (
    <AdminShell title="Vue d'ensemble">
      {overview.isLoading && <Skeleton lines={2} />}
      {overview.isError && <ErrorState detail="Impossible de charger les compteurs." onRetry={() => overview.refetch()} />}
      {overview.data && (
        <div className="admin-stats">
          <Link href="/admin/episodes" className="admin-stat"><b>{overview.data.episodesPublished}</b><span>Épisodes publiés</span></Link>
          <Link href="/admin/episodes" className="admin-stat"><b>{overview.data.episodesDraft}</b><span>Brouillons</span></Link>
          <Link href="/admin/invites" className="admin-stat"><b>{overview.data.guests}</b><span>Invités</span></Link>
          <div className="admin-stat"><b>{overview.data.members}</b><span>Membres</span></div>
          <Link href="/admin/commandes" className="admin-stat"><b>{overview.data.ordersPaid}</b><span>Commandes payées</span></Link>
          <Link href="/admin/commandes" className="admin-stat"><b>{overview.data.ordersPending}</b><span>Paiements en attente</span></Link>
        </div>
      )}

      <section className="admin-section">
        <h2>Dernières actions</h2>
        {audit.isLoading && <Skeleton lines={3} />}
        {audit.data && audit.data.length === 0 && <p className="player-note">Aucune action enregistrée pour le moment.</p>}
        {audit.data && audit.data.length > 0 && (
          <ul className="admin-log">
            {audit.data.map((e) => (
              <li key={e.id}>
                <span className="admin-log-when">{when(e.createdAt)}</span>
                <code>{e.action}</code>
                <span>{e.details ?? e.targetId ?? ""}</span>
                <span className="admin-log-actor">{e.actorEmail}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/journal" className="btn btn-ghost" style={{ marginTop: 16 }}>Tout le journal</Link>
      </section>
    </AdminShell>
  );
}
