"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { when } from "@/components/admin/Form";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useAuditLog } from "@/lib/admin";

export default function AdminAuditPage() {
  const log = useAuditLog(200);

  return (
    <AdminShell title="Journal d'audit">
      {log.isLoading && <Skeleton lines={5} />}
      {log.isError && <ErrorState detail="Impossible de charger le journal." onRetry={() => log.refetch()} />}
      {log.data && log.data.length === 0 && <EmptyState title="Aucune action enregistrée." />}
      {log.data && log.data.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Quand</th><th>Qui</th><th>Action</th><th>Cible</th><th>Détails</th></tr></thead>
            <tbody>
              {log.data.map((e) => (
                <tr key={e.id}>
                  <td>{when(e.createdAt)}</td>
                  <td>{e.actorEmail}</td>
                  <td><code>{e.action}</code></td>
                  <td>{e.targetType}{e.targetId ? <><br /><small><code>{e.targetId.slice(0, 8)}</code></small></> : null}</td>
                  <td>{e.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
