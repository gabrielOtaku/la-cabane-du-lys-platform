"use client";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge, FormMessage } from "@/components/admin/Form";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useAdminEpisodes, useDeleteEpisode, useEpisodeStatus } from "@/lib/admin";
import { formatTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { AdminEpisode } from "@/types/admin";

export default function AdminEpisodesPage() {
  const list = useAdminEpisodes();
  const status = useEpisodeStatus();
  const remove = useDeleteEpisode();

  const toggle = (ep: AdminEpisode) => {
    const action = ep.status === "PUBLISHED" ? "unpublish" : "publish";
    const question = action === "publish"
      ? `Publier l'épisode ${ep.number} « ${ep.title} » ? Il deviendra visible sur le site.`
      : `Dépublier l'épisode ${ep.number} ? Il disparaîtra du site.`;
    if (!window.confirm(question)) return;
    status.mutate({ id: ep.id, action }, {
      onSuccess: (r) => toast(r.status === "PUBLISHED" ? "Épisode publié." : "Épisode dépublié.", r.title),
      onError: (e) => toast("Action impossible.", e instanceof Error ? e.message : ""),
    });
  };

  const del = (ep: AdminEpisode) => {
    if (!window.confirm(`Supprimer définitivement l'épisode ${ep.number} « ${ep.title} » ?`)) return;
    remove.mutate(ep.id, {
      onSuccess: () => toast("Épisode supprimé."),
      onError: (e) => toast("Suppression impossible.", e instanceof Error ? e.message : ""),
    });
  };

  return (
    <AdminShell title="Épisodes" actions={<Link href="/admin/episodes/new" className="btn btn-solid">Nouvel épisode</Link>}>
      {list.isLoading && <Skeleton lines={4} />}
      {list.isError && <ErrorState detail="Impossible de charger les épisodes." onRetry={() => list.refetch()} />}
      {list.data && list.data.length === 0 && <EmptyState title="Aucun épisode. Créez le premier." />}
      <FormMessage message={status.error instanceof Error ? status.error.message : null} />

      {list.data && list.data.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>N°</th><th>Titre</th><th>Invités</th><th>Durée</th><th>Statut</th><th>Publié le</th><th className="right">Actions</th></tr>
            </thead>
            <tbody>
              {list.data.map((ep) => (
                <tr key={ep.id}>
                  <td>{String(ep.number).padStart(2, "0")}</td>
                  <td><Link href={`/admin/episodes/${ep.id}`} className="admin-link">{ep.title}</Link><br /><small>/{ep.slug}</small></td>
                  <td>{ep.guests.map((g) => g.name).join(", ") || <em>aucun</em>}</td>
                  <td>{ep.durationSec ? formatTime(ep.durationSec) : "—"}</td>
                  <td><Badge tone={ep.status === "PUBLISHED" ? "ok" : "warn"}>{ep.status === "PUBLISHED" ? "Publié" : "Brouillon"}</Badge></td>
                  <td>{ep.publishedAt ?? "—"}</td>
                  <td className="right">
                    <button type="button" className="admin-btn" onClick={() => toggle(ep)} disabled={status.isPending}>
                      {ep.status === "PUBLISHED" ? "Dépublier" : "Publier"}
                    </button>
                    <button type="button" className="admin-btn danger" onClick={() => del(ep)} disabled={remove.isPending}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
