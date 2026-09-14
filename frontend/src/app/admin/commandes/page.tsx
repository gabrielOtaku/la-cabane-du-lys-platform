"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge, money, when } from "@/components/admin/Form";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useAdminOrders, useFulfillOrder } from "@/lib/admin";
import { toast } from "@/lib/toast";
import type { AdminOrder, OrderStatus } from "@/types/admin";

const STATUS: Record<OrderStatus, { label: string; tone: "neutral" | "ok" | "warn" | "danger" | "info" }> = {
  PENDING: { label: "Paiement en attente", tone: "warn" },
  PAID: { label: "Payée", tone: "ok" },
  FULFILLED: { label: "Expédiée", tone: "info" },
  CANCELLED: { label: "Annulée", tone: "neutral" },
  EXPIRED: { label: "Expirée", tone: "neutral" },
  PAYMENT_MISMATCH: { label: "Montant à vérifier", tone: "danger" },
};

export default function AdminOrdersPage() {
  const list = useAdminOrders();
  const fulfill = useFulfillOrder();

  const ship = (o: AdminOrder) => {
    if (!window.confirm("Marquer cette commande comme expédiée ?")) return;
    fulfill.mutate(o.id, {
      onSuccess: () => toast("Commande marquée expédiée."),
      onError: (e) => toast("Action impossible.", e instanceof Error ? e.message : ""),
    });
  };

  return (
    <AdminShell title="Commandes">
      {list.isLoading && <Skeleton lines={4} />}
      {list.isError && <ErrorState detail="Impossible de charger les commandes." onRetry={() => list.refetch()} />}
      {list.data && list.data.length === 0 && <EmptyState title="Aucune commande pour l'instant." />}
      {list.data && list.data.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Date</th><th>Client</th><th>Pièces</th><th>Total</th><th>Drop</th><th>État</th><th className="right">Actions</th></tr></thead>
            <tbody>
              {list.data.map((o) => (
                <tr key={o.id}>
                  <td>{when(o.createdAt)}<br /><small><code>{o.id.slice(0, 8)}</code></small></td>
                  <td>{o.customerEmail ?? "—"}</td>
                  <td>{o.items.map((i) => `${i.quantity} × ${i.productName}`).join(", ")}</td>
                  <td>{money(o.totalCents, o.currency)}</td>
                  <td>{o.dropSlug ?? "—"}</td>
                  <td><Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge></td>
                  <td className="right">
                    {o.status === "PAID" && <button type="button" className="admin-btn" onClick={() => ship(o)} disabled={fulfill.isPending}>Expédiée</button>}
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
