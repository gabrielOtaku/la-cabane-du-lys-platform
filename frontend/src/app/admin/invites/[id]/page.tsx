"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Field, FormMessage, useViolations } from "@/components/admin/Form";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useAdminGuest, useSaveGuest } from "@/lib/admin";
import { toast } from "@/lib/toast";
import type { GuestUpsert } from "@/types/admin";

const EMPTY: GuestUpsert = {
  name: "", slug: "", role: "", company: "", companyUrl: "", city: "", region: "", category: "",
  angle: "", bio: "", photoUrl: "", quote: "", featured: false,
};

export default function AdminGuestEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const guest = useAdminGuest(isNew ? null : id);
  const save = useSaveGuest();
  const [form, setForm] = useState<GuestUpsert>(EMPTY);

  useEffect(() => {
    if (!guest.data) return;
    const g = guest.data;
    setForm({
      name: g.name, slug: g.slug, role: g.role ?? "", company: g.company ?? "", companyUrl: g.companyUrl ?? "",
      city: g.city ?? "", region: g.region ?? "", category: g.category ?? "", angle: g.angle ?? "", bio: g.bio ?? "",
      photoUrl: g.photoUrl ?? "", quote: g.quote ?? "", featured: g.featured,
    });
  }, [guest.data]);

  const { fields, message } = useViolations(save.error);
  const set = <K extends keyof GuestUpsert>(key: K, value: GuestUpsert[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({ id: isNew ? null : id, data: form }, {
      onSuccess: (g) => {
        toast(isNew ? "Invité créé." : "Invité enregistré.", g.name);
        if (isNew) router.replace(`/admin/invites/${g.id}`);
      },
    });
  };

  const text = (key: keyof GuestUpsert, label: string, opts: { hint?: string; wide?: boolean; max?: number; type?: string } = {}) => (
    <Field label={label} htmlFor={key} error={fields[key]} hint={opts.hint} wide={opts.wide}>
      <input id={key} type={opts.type ?? "text"} value={(form[key] as string) ?? ""} onChange={(e) => set(key, e.target.value as never)} maxLength={opts.max ?? 255} />
    </Field>
  );

  return (
    <AdminShell title={isNew ? "Nouvel invité" : guest.data?.name ?? "Invité"} actions={<Link href="/admin/invites" className="btn btn-ghost">Retour</Link>}>
      {!isNew && guest.isLoading && <Skeleton lines={6} />}
      {!isNew && guest.isError && <ErrorState detail="Invité introuvable." onRetry={() => guest.refetch()} />}

      {(isNew || guest.data) && (
        <form className="admin-form" onSubmit={submit} noValidate>
          <FormMessage message={message} />
          <div className="admin-grid">
            {text("name", "Nom", { wide: true })}
            {text("slug", "Slug", { hint: "Vide = généré depuis le nom.", max: 160 })}
            {text("role", "Rôle")}
            {text("company", "Entreprise")}
            {text("companyUrl", "Site de l'entreprise", { type: "url", max: 500 })}
            {text("city", "Ville", { max: 120 })}
            {text("region", "Région", { max: 120 })}
            {text("category", "Catégorie", { hint: "Taxonomie libre, ex. « Service automobile ».", max: 120 })}
            {text("photoUrl", "URL de la photo", { type: "url", max: 500, hint: "Uniquement une photo fournie et approuvée par l'invité." })}
            <Field label="Angle" htmlFor="angle" error={fields.angle} wide hint="Une phrase : ce que l'on apprend dans son épisode.">
              <textarea id="angle" rows={2} maxLength={400} value={form.angle ?? ""} onChange={(e) => set("angle", e.target.value)} />
            </Field>
            <Field label="Biographie" htmlFor="bio" error={fields.bio} wide>
              <textarea id="bio" rows={5} maxLength={2000} value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} />
            </Field>
            <Field label="Citation" htmlFor="quote" error={fields.quote} wide hint="Uniquement si réellement prononcée et validée par l'invité.">
              <textarea id="quote" rows={2} maxLength={600} value={form.quote ?? ""} onChange={(e) => set("quote", e.target.value)} />
            </Field>
            <label className="admin-check">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Mettre en avant sur l&apos;accueil
            </label>
          </div>
          <div className="admin-actions-row">
            <button type="submit" className="btn btn-solid" disabled={save.isPending}>{save.isPending ? "Enregistrement…" : "Enregistrer"}</button>
            <Link href="/admin/invites" className="btn btn-ghost">Annuler</Link>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
