"use client";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge, Field, FormMessage, money, useViolations } from "@/components/admin/Form";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useAdminProducts, useDeleteProduct, useSaveProduct } from "@/lib/admin";
import { toast } from "@/lib/toast";
import type { AdminProduct, ProductUpsert } from "@/types/admin";

const EMPTY: ProductUpsert = { name: "", tagline: "", priceCents: 0, currency: "CAD", edition: "", stock: 0, available: false };

export default function AdminProductsPage() {
  const list = useAdminProducts();
  const save = useSaveProduct();
  const remove = useDeleteProduct();
  const [editing, setEditing] = useState<string | null | "new">(null);
  const [form, setForm] = useState<ProductUpsert>(EMPTY);
  const { fields, message } = useViolations(save.error);

  const startEdit = (p: AdminProduct | null) => {
    setEditing(p ? p.id : "new");
    setForm(p ? { name: p.name, tagline: p.tagline ?? "", priceCents: p.priceCents, currency: p.currency, edition: p.edition ?? "", stock: p.stock, available: p.available } : EMPTY);
    save.reset();
  };

  const set = <K extends keyof ProductUpsert>(key: K, value: ProductUpsert[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({ id: editing === "new" ? null : editing, data: form }, {
      onSuccess: (p) => { toast("Pièce enregistrée.", p.name); setEditing(null); },
    });
  };

  const del = (p: AdminProduct) => {
    if (!window.confirm(`Supprimer la pièce « ${p.name} » ?`)) return;
    remove.mutate(p.id, {
      onSuccess: () => toast("Pièce supprimée."),
      onError: (e) => toast("Suppression impossible.", e instanceof Error ? e.message : ""),
    });
  };

  return (
    <AdminShell title="Pièces" actions={<button type="button" className="btn btn-solid" onClick={() => startEdit(null)}>Nouvelle pièce</button>}>
      {editing !== null && (
        <form className="admin-form admin-inline-form" onSubmit={submit} noValidate>
          <h2>{editing === "new" ? "Nouvelle pièce" : "Modifier la pièce"}</h2>
          <FormMessage message={message} />
          <div className="admin-grid">
            <Field label="Nom" htmlFor="name" error={fields.name} wide>
              <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={255} required />
            </Field>
            <Field label="Accroche" htmlFor="tagline" error={fields.tagline} wide>
              <input id="tagline" value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} maxLength={600} />
            </Field>
            <Field label="Prix (cents)" htmlFor="priceCents" error={fields.priceCents} hint={money(form.priceCents, form.currency || "CAD")}>
              <input id="priceCents" type="number" min={0} value={form.priceCents} onChange={(e) => set("priceCents", Number(e.target.value))} />
            </Field>
            <Field label="Devise" htmlFor="currency" error={fields.currency}>
              <input id="currency" value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} maxLength={3} />
            </Field>
            <Field label="Édition" htmlFor="edition" error={fields.edition} hint="Ex. « Édition limitée — 50 pièces ».">
              <input id="edition" value={form.edition ?? ""} onChange={(e) => set("edition", e.target.value)} maxLength={255} />
            </Field>
            <Field label="Stock" htmlFor="stock" error={fields.stock} hint="Ne peut pas descendre sous les unités réservées.">
              <input id="stock" type="number" min={0} value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} />
            </Field>
            <label className="admin-check">
              <input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)} />
              Pièce active (achetable quand le drop est ouvert)
            </label>
          </div>
          <div className="admin-actions-row">
            <button type="submit" className="btn btn-solid" disabled={save.isPending}>{save.isPending ? "Enregistrement…" : "Enregistrer"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
          </div>
        </form>
      )}

      {list.isLoading && <Skeleton lines={4} />}
      {list.isError && <ErrorState detail="Impossible de charger les pièces." onRetry={() => list.refetch()} />}
      {list.data && list.data.length === 0 && <EmptyState title="Aucune pièce. Créez la première." />}
      {list.data && list.data.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Nom</th><th>Prix</th><th>Stock</th><th>Réservé</th><th>Reste</th><th>Active</th><th className="right">Actions</th></tr></thead>
            <tbody>
              {list.data.map((p) => (
                <tr key={p.id}>
                  <td><button type="button" className="admin-link as-button" onClick={() => startEdit(p)}>{p.name}</button><br /><small>{p.edition ?? ""}</small></td>
                  <td>{money(p.priceCents, p.currency)}</td>
                  <td>{p.stock}</td>
                  <td>{p.reserved}</td>
                  <td>{p.remaining}</td>
                  <td>{p.available ? <Badge tone="ok">Oui</Badge> : <Badge>Non</Badge>}</td>
                  <td className="right">
                    <button type="button" className="admin-btn" onClick={() => startEdit(p)}>Modifier</button>
                    <button type="button" className="admin-btn danger" onClick={() => del(p)} disabled={remove.isPending}>Supprimer</button>
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
