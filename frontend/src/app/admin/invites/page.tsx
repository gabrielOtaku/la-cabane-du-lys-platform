"use client";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/admin/Form";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useAdminGuests, useDeleteGuest } from "@/lib/admin";
import { toast } from "@/lib/toast";
import type { AdminGuest } from "@/types/admin";

export default function AdminGuestsPage() {
  const list = useAdminGuests();
  const remove = useDeleteGuest();

  const del = (g: AdminGuest) => {
    if (!window.confirm(`Supprimer l'invité·e « ${g.name} » ?`)) return;
    remove.mutate(g.id, {
      onSuccess: () => toast("Invité supprimé."),
      onError: (e) => toast("Suppression impossible.", e instanceof Error ? e.message : ""),
    });
  };

  return (
    <AdminShell title="Invités" actions={<Link href="/admin/invites/new" className="btn btn-solid">Nouvel invité</Link>}>
      {list.isLoading && <Skeleton lines={4} />}
      {list.isError && <ErrorState detail="Impossible de charger les invités." onRetry={() => list.refetch()} />}
      {list.data && list.data.length === 0 && <EmptyState title="Aucun invité pour l'instant." />}
      {list.data && list.data.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Nom</th><th>Rôle · Entreprise</th><th>Lieu</th><th>Catégorie</th><th>Mis en avant</th><th className="right">Actions</th></tr></thead>
            <tbody>
              {list.data.map((g) => (
                <tr key={g.id}>
                  <td><Link href={`/admin/invites/${g.id}`} className="admin-link">{g.name}</Link><br /><small>/{g.slug}</small></td>
                  <td>{[g.role, g.company].filter(Boolean).join(" · ") || "—"}</td>
                  <td>{[g.city, g.region].filter(Boolean).join(", ") || "—"}</td>
                  <td>{g.category ?? "—"}</td>
                  <td>{g.featured ? <Badge tone="ok">Oui</Badge> : <Badge>Non</Badge>}</td>
                  <td className="right">
                    <button type="button" className="admin-btn danger" onClick={() => del(g)} disabled={remove.isPending}>Supprimer</button>
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
