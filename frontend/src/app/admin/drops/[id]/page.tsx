"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge, Field, FormMessage, isoToLocalInput, localInputToIso, money, useViolations } from "@/components/admin/Form";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useAdminDrop, useAdminProducts, useSaveDrop } from "@/lib/admin";
import { toast } from "@/lib/toast";
import type { DropUpsert } from "@/types/admin";

const EMPTY: DropUpsert = { title: "", slug: "", subtitle: "", heroImage: "", opensAt: null, closesAt: null, maxPerCustomer: 1, productIds: [] };

export default function AdminDropEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const drop = useAdminDrop(isNew ? null : id);
  const products = useAdminProducts();
  const save = useSaveDrop();
  const [form, setForm] = useState<DropUpsert>(EMPTY);
  const [opens, setOpens] = useState("");
  const [closes, setCloses] = useState("");

  useEffect(() => {
    if (!drop.data) return;
    const d = drop.data;
    setForm({
      title: d.title, slug: d.slug, subtitle: d.subtitle ?? "", heroImage: d.heroImage ?? "",
      opensAt: d.opensAt, closesAt: d.closesAt, maxPerCustomer: d.maxPerCustomer, productIds: d.products.map((p) => p.id),
    });
    setOpens(isoToLocalInput(d.opensAt));
    setCloses(isoToLocalInput(d.closesAt));
  }, [drop.data]);

  const { fields, message } = useViolations(save.error);
  const set = <K extends keyof DropUpsert>(key: K, value: DropUpsert[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleProduct = (pid: string) =>
    set("productIds", form.productIds.includes(pid) ? form.productIds.filter((x) => x !== pid) : [...form.productIds, pid]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({ id: isNew ? null : id, data: { ...form, opensAt: localInputToIso(opens), closesAt: localInputToIso(closes) } }, {
      onSuccess: (d) => {
        toast(isNew ? "Drop créé." : "Drop enregistré.", d.title);
        if (isNew) router.replace(`/admin/drops/${d.id}`);
      },
    });
  };

  return (
    <AdminShell title={isNew ? "Nouveau drop" : drop.data?.title ?? "Drop"} actions={<Link href="/admin/drops" className="btn btn-ghost">Retour</Link>}>
      {!isNew && drop.isLoading && <Skeleton lines={6} />}
      {!isNew && drop.isError && <ErrorState detail="Drop introuvable." onRetry={() => drop.refetch()} />}

      {(isNew || drop.data) && (
        <form className="admin-form" onSubmit={submit} noValidate>
          {drop.data && (
            <p className="admin-status-row">
              Cycle de vie : <Badge tone={drop.data.lifecycle === "PUBLISHED" ? "ok" : "warn"}>{drop.data.lifecycle}</Badge>
              État public : <Badge tone="info">{drop.data.status}</Badge>
              <span className="admin-hint">La publication se fait depuis la liste des drops ; elle exige des dates cohérentes et au moins une pièce.</span>
            </p>
          )}
          <FormMessage message={message} />
          <div className="admin-grid">
            <Field label="Titre" htmlFor="title" error={fields.title} wide>
              <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={255} required />
            </Field>
            <Field label="Slug" htmlFor="slug" error={fields.slug} hint="Vide = généré depuis le titre.">
              <input id="slug" value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} maxLength={160} />
            </Field>
            <Field label="Limite par client" htmlFor="maxPerCustomer" error={fields.maxPerCustomer}>
              <input id="maxPerCustomer" type="number" min={1} value={form.maxPerCustomer} onChange={(e) => set("maxPerCustomer", Number(e.target.value))} />
            </Field>
            <Field label="Sous-titre" htmlFor="subtitle" error={fields.subtitle} wide>
              <input id="subtitle" value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} maxLength={400} />
            </Field>
            <Field label="Ouverture" htmlFor="opensAt" error={fields.opensAt} hint="Heure locale de votre navigateur.">
              <input id="opensAt" type="datetime-local" value={opens} onChange={(e) => setOpens(e.target.value)} />
            </Field>
            <Field label="Fermeture" htmlFor="closesAt" error={fields.closesAt}>
              <input id="closesAt" type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} />
            </Field>
            <Field label="Image d'en-tête (URL)" htmlFor="heroImage" error={fields.heroImage} wide>
              <input id="heroImage" type="url" value={form.heroImage ?? ""} onChange={(e) => set("heroImage", e.target.value)} maxLength={500} />
            </Field>
          </div>

          <fieldset className="admin-fieldset">
            <legend>Pièces du drop {fields.productIds && <span className="admin-error">{fields.productIds}</span>}</legend>
            {products.isLoading && <Skeleton lines={2} />}
            {products.data && products.data.length === 0 && <p className="player-note">Aucune pièce. <Link href="/admin/produits" className="admin-link">Créer une pièce</Link>.</p>}
            <div className="admin-checks">
              {(products.data ?? []).map((p) => (
                <label key={p.id} className="admin-check">
                  <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                  {p.name} · {money(p.priceCents, p.currency)} · reste {p.remaining}{!p.available && " · inactive"}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="admin-actions-row">
            <button type="submit" className="btn btn-solid" disabled={save.isPending}>{save.isPending ? "Enregistrement…" : "Enregistrer"}</button>
            <Link href="/admin/drops" className="btn btn-ghost">Annuler</Link>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
