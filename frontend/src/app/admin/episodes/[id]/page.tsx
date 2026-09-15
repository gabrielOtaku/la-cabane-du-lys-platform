"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge, Field, FormMessage, useViolations } from "@/components/admin/Form";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useAdminEpisode, useAdminGuests, useEpisodeStatus, useSaveEpisode } from "@/lib/admin";
import { toast } from "@/lib/toast";
import type { EpisodeUpsert } from "@/types/admin";
import type { TranscriptLine } from "@/types";

const EMPTY: EpisodeUpsert = {
  title: "", number: 1, slug: "", shortDescription: "", description: "", durationSec: 0, publishedAt: null,
  youtubeId: "", audioUrl: "", videoUrl: "", spotifyUrl: "", appleUrl: "", thumbnailUrl: "", guestIds: [], transcript: [],
};

/** « 1:23 | Texte » ou « 83 | Texte », une ligne par segment. */
function parseTranscript(text: string): { lines: TranscriptLine[]; error: string | null } {
  const lines: TranscriptLine[] = [];
  const rows = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const [i, row] of rows.entries()) {
    const sep = row.indexOf("|");
    if (sep < 0) return { lines: [], error: `Ligne ${i + 1} : format attendu « mm:ss | texte ».` };
    const time = row.slice(0, sep).trim();
    const body = row.slice(sep + 1).trim();
    const parts = time.split(":").map(Number);
    if (parts.some((p) => Number.isNaN(p)) || parts.length > 3) return { lines: [], error: `Ligne ${i + 1} : timecode illisible « ${time} ».` };
    const t = parts.reduce((acc, p) => acc * 60 + p, 0);
    if (!body) return { lines: [], error: `Ligne ${i + 1} : texte manquant.` };
    lines.push({ t, text: body });
  }
  return { lines, error: null };
}

function formatTranscript(lines: TranscriptLine[]): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return lines.map((l) => `${Math.floor(l.t / 60)}:${pad(l.t % 60)} | ${l.text}`).join("\n");
}

export default function AdminEpisodeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const episode = useAdminEpisode(isNew ? null : id);
  const guests = useAdminGuests();
  const save = useSaveEpisode();
  const status = useEpisodeStatus();

  const [form, setForm] = useState<EpisodeUpsert>(EMPTY);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  useEffect(() => {
    if (!episode.data) return;
    const e = episode.data;
    setForm({
      title: e.title, number: e.number, slug: e.slug, shortDescription: e.shortDescription ?? "", description: e.description ?? "",
      durationSec: e.durationSec, publishedAt: e.publishedAt, youtubeId: e.youtubeId ?? "", audioUrl: e.audioUrl ?? "",
      videoUrl: e.videoUrl ?? "", spotifyUrl: e.spotifyUrl ?? "", appleUrl: e.appleUrl ?? "", thumbnailUrl: e.thumbnailUrl ?? "",
      guestIds: e.guestIds, transcript: e.transcript,
    });
    setTranscriptText(formatTranscript(e.transcript));
  }, [episode.data]);

  const { fields, message } = useViolations(save.error);
  const set = <K extends keyof EpisodeUpsert>(key: K, value: EpisodeUpsert[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleGuest = (gid: string) =>
    set("guestIds", form.guestIds.includes(gid) ? form.guestIds.filter((x) => x !== gid) : [...form.guestIds, gid]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTranscript(transcriptText);
    setTranscriptError(parsed.error);
    if (parsed.error) return;
    save.mutate({ id: isNew ? null : id, data: { ...form, transcript: parsed.lines, publishedAt: form.publishedAt || null } }, {
      onSuccess: (ep) => {
        toast(isNew ? "Épisode créé." : "Épisode enregistré.", ep.title);
        if (isNew) router.replace(`/admin/episodes/${ep.id}`);
      },
    });
  };

  const publishToggle = () => {
    if (!episode.data) return;
    const action = episode.data.status === "PUBLISHED" ? "unpublish" : "publish";
    if (!window.confirm(action === "publish" ? "Publier cet épisode sur le site ?" : "Dépublier cet épisode ?")) return;
    status.mutate({ id, action }, {
      onSuccess: (r) => toast(r.status === "PUBLISHED" ? "Épisode publié." : "Épisode dépublié."),
      onError: (err) => toast("Action impossible.", err instanceof Error ? err.message : ""),
    });
  };

  const title = isNew ? "Nouvel épisode" : episode.data ? `Épisode ${episode.data.number}` : "Épisode";
  const guestOptions = useMemo(() => guests.data ?? [], [guests.data]);

  return (
    <AdminShell
      title={title}
      actions={
        <>
          <Link href="/admin/episodes" className="btn btn-ghost">Retour</Link>
          {!isNew && episode.data && (
            <button type="button" className="btn btn-solid" onClick={publishToggle} disabled={status.isPending}>
              {episode.data.status === "PUBLISHED" ? "Dépublier" : "Publier"}
            </button>
          )}
        </>
      }
    >
      {!isNew && episode.isLoading && <Skeleton lines={6} />}
      {!isNew && episode.isError && <ErrorState detail="Épisode introuvable." onRetry={() => episode.refetch()} />}

      {(isNew || episode.data) && (
        <form className="admin-form" onSubmit={submit} noValidate>
          {!isNew && episode.data && (
            <p className="admin-status-row">
              Statut : <Badge tone={episode.data.status === "PUBLISHED" ? "ok" : "warn"}>{episode.data.status === "PUBLISHED" ? "Publié" : "Brouillon"}</Badge>
              <span className="admin-hint">Un épisode publié exige au moins un invité et une description courte.</span>
            </p>
          )}
          <FormMessage message={message} />

          <div className="admin-grid">
            <Field label="Titre" htmlFor="title" error={fields.title} wide>
              <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} required maxLength={255} />
            </Field>
            <Field label="Numéro" htmlFor="number" error={fields.number}>
              <input id="number" type="number" min={1} value={form.number} onChange={(e) => set("number", Number(e.target.value))} />
            </Field>
            <Field label="Slug" htmlFor="slug" error={fields.slug} hint="Vide = généré depuis le titre.">
              <input id="slug" value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} maxLength={160} />
            </Field>
            <Field label="Description courte" htmlFor="shortDescription" error={fields.shortDescription} wide hint="Affichée dans les listes et les métadonnées (400 caractères max).">
              <textarea id="shortDescription" rows={2} maxLength={400} value={form.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} />
            </Field>
            <Field label="Description" htmlFor="description" error={fields.description} wide>
              <textarea id="description" rows={5} maxLength={2000} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Durée (secondes)" htmlFor="durationSec" error={fields.durationSec}>
              <input id="durationSec" type="number" min={0} value={form.durationSec} onChange={(e) => set("durationSec", Number(e.target.value))} />
            </Field>
            <Field label="Date de publication" htmlFor="publishedAt" error={fields.publishedAt} hint="Vide = date du jour à la publication.">
              <input id="publishedAt" type="date" value={form.publishedAt ?? ""} onChange={(e) => set("publishedAt", e.target.value || null)} />
            </Field>
            <Field label="Identifiant YouTube" htmlFor="youtubeId" error={fields.youtubeId} hint="La partie après v= dans l'URL.">
              <input id="youtubeId" value={form.youtubeId ?? ""} onChange={(e) => set("youtubeId", e.target.value)} maxLength={60} />
            </Field>
            <Field label="URL audio (extrait ou épisode)" htmlFor="audioUrl" error={fields.audioUrl} hint="Fichier servi avec en-têtes CORS pour la waveform.">
              <input id="audioUrl" type="url" value={form.audioUrl ?? ""} onChange={(e) => set("audioUrl", e.target.value)} maxLength={500} />
            </Field>
            <Field label="URL vidéo" htmlFor="videoUrl" error={fields.videoUrl}>
              <input id="videoUrl" type="url" value={form.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value)} maxLength={500} />
            </Field>
            <Field label="URL Spotify" htmlFor="spotifyUrl" error={fields.spotifyUrl}>
              <input id="spotifyUrl" type="url" value={form.spotifyUrl ?? ""} onChange={(e) => set("spotifyUrl", e.target.value)} maxLength={500} />
            </Field>
            <Field label="URL Apple Podcasts" htmlFor="appleUrl" error={fields.appleUrl}>
              <input id="appleUrl" type="url" value={form.appleUrl ?? ""} onChange={(e) => set("appleUrl", e.target.value)} maxLength={500} />
            </Field>
            <Field label="URL de la vignette" htmlFor="thumbnailUrl" error={fields.thumbnailUrl}>
              <input id="thumbnailUrl" type="url" value={form.thumbnailUrl ?? ""} onChange={(e) => set("thumbnailUrl", e.target.value)} maxLength={500} />
            </Field>
          </div>

          <fieldset className="admin-fieldset">
            <legend>Invités {fields.guestIds && <span className="admin-error">{fields.guestIds}</span>}</legend>
            {guests.isLoading && <Skeleton lines={2} />}
            {guestOptions.length === 0 && !guests.isLoading && <p className="player-note">Aucun invité. <Link href="/admin/invites/new" className="admin-link">Créer un invité</Link>.</p>}
            <div className="admin-checks">
              {guestOptions.map((g) => (
                <label key={g.id} className="admin-check">
                  <input type="checkbox" checked={form.guestIds.includes(g.id)} onChange={() => toggleGuest(g.id)} />
                  {g.name}{g.company ? ` · ${g.company}` : ""}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Transcription" htmlFor="transcript" error={transcriptError ?? fields.transcript} wide
                 hint="Une ligne par segment : « mm:ss | texte ». Les lignes sont triées par timecode.">
            <textarea id="transcript" rows={10} value={transcriptText} onChange={(e) => setTranscriptText(e.target.value)} spellCheck={false} />
          </Field>

          <div className="admin-actions-row">
            <button type="submit" className="btn btn-solid" disabled={save.isPending}>{save.isPending ? "Enregistrement…" : "Enregistrer"}</button>
            <Link href="/admin/episodes" className="btn btn-ghost">Annuler</Link>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
