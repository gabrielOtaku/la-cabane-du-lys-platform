"use client";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge, when } from "@/components/admin/Form";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useAdminDrops, useDeleteDrop, useDropLifecycle } from "@/lib/admin";
import { toast } from "@/lib/toast";
import type { AdminDrop, DropLifecycle, DropStatusAdmin } from "@/types/admin";

const STATUS_LABEL: Record<DropStatusAdmin, { label: string; tone: "neutral" | "ok" | "warn" | "danger" | "info" }> = {
  DRAFT: { label: "Brouillon", tone: "warn" },
  SCHEDULED: { label: "Programmé", tone: "info" },
  OPEN: { label: "Ouvert", tone: "ok" },
  CLOSED: { label: "Terminé", tone: "neutral" },
  ARCHIVED: { label: "Archivé", tone: "neutral" },
};

export default function AdminDropsPage() {
  const list = useAdminDrops();
  const lifecycle = useDropLifecycle();
  const remove = useDeleteDrop();

  const change = (d: AdminDrop, to: DropLifecycle) => {
    const q = to === "PUBLISHED"
      ? `Publier le drop « ${d.title} » ? Le compte à rebours deviendra visible sur le site.`
      : to === "ARCHIVED" ? `Archiver le drop « ${d.title} » ?` : `Repasser le drop « ${d.title} » en brouillon ?`;
    if (!window.confirm(q)) return;
    lifecycle.mutate({ id: d.id, lifecycle: to }, {
      onSuccess: (r) => toast("Drop mis à jour.", `${r.title} · ${STATUS_LABEL[r.status].label}`),
      onError: (e) => toast("Action impossible.", e instanceof Error ? e.message : ""),
    });
  };

  const del = (d: AdminDrop) => {
    if (!window.confirm(`Supprimer le drop « ${d.title} » ?`)) return;
    remove.mutate(d.id, {
      onSuccess: () => toast("Drop supprimé."),
      onError: (e) => toast("Suppression impossible.", e instanceof Error ? e.message : ""),
    });
  };

  return (
    <AdminShell title="Drops" actions={<Link href="/admin/drops/new" className="btn btn-solid">Nouveau drop</Link>}>
      {list.isLoading && <Skeleton lines={4} />}
      {list.isError && <ErrorState detail="Impossible de charger les drops." onRetry={() => list.refetch()} />}
      {list.data && list.data.length === 0 && <EmptyState title="Aucun drop. Créez le premier." />}
      {list.data && list.data.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Titre</th><th>Ouverture</th><th>Fermeture</th><th>Pièces</th><th>Limite / client</th><th>État</th><th className="right">Actions</th></tr></thead>
            <tbody>
              {list.data.map((d) => (
                <tr key={d.id}>
                  <td><Link href={`/admin/drops/${d.id}`} className="admin-link">{d.title}</Link><br /><small>/{d.slug}</small></td>
                  <td>{when(d.opensAt)}</td>
                  <td>{when(d.closesAt)}</td>
                  <td>{d.products.length}</td>
                  <td>{d.maxPerCustomer}</td>
                  <td><Badge tone={STATUS_LABEL[d.status].tone}>{STATUS_LABEL[d.status].label}</Badge></td>
                  <td className="right">
                    {d.lifecycle !== "PUBLISHED" && <button type="button" className="admin-btn" onClick={() => change(d, "PUBLISHED")} disabled={lifecycle.isPending}>Publier</button>}
                    {d.lifecycle === "PUBLISHED" && <button type="button" className="admin-btn" onClick={() => change(d, "DRAFT")} disabled={lifecycle.isPending}>Brouillon</button>}
                    {d.lifecycle !== "ARCHIVED" && <button type="button" className="admin-btn" onClick={() => change(d, "ARCHIVED")} disabled={lifecycle.isPending}>Archiver</button>}
                    {d.lifecycle !== "PUBLISHED" && <button type="button" className="admin-btn danger" onClick={() => del(d)} disabled={remove.isPending}>Supprimer</button>}
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
