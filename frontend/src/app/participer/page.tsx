"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

const CONTACT_EMAIL = "lacabanedulys@gmail.com";

export default function ParticiperPage() {
  const [form, setForm] = useState({
    guestName: "", company: "", city: "", reason: "",
    proposerName: "", proposerEmail: "", consent: false,
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const mailtoHref = () => {
    const subject = encodeURIComponent(`Proposition d'invité — ${form.guestName || "sans nom"}`);
    const body = encodeURIComponent(
      `Personne proposée : ${form.guestName}\n` +
      `Entreprise : ${form.company}\n` +
      `Ville : ${form.city}\n` +
      `Raison de l'invitation : ${form.reason}\n\n` +
      `Proposé par : ${form.proposerName} (${form.proposerEmail})`
    );
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const canSend = form.guestName.trim() && form.proposerEmail.trim() && form.consent;

  return (
    <div className="subpage">
      <div className="container">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Accueil</Link>
        <div className="page-head" data-reveal>
          <span className="eyebrow">Participer</span>
          <h1 className="sec-title">Proposer un <em>entrepreneur</em>,<br />rejoindre le projet.</h1>
          <p className="lead">
            Vous connaissez quelqu&apos;un dont le parcours mérite d&apos;être raconté ? Ou vous voulez rejoindre
            l&apos;équipe audiovisuelle ? Écrivez-nous.
          </p>
        </div>

        <div className="auth" style={{ maxWidth: 560, margin: "40px auto 0" }}>
          <div className="field-row">
            <input placeholder="Nom de la personne proposée" value={form.guestName} onChange={set("guestName")} />
          </div>
          <div className="field-row">
            <input placeholder="Entreprise" value={form.company} onChange={set("company")} />
          </div>
          <div className="field-row">
            <input placeholder="Ville" value={form.city} onChange={set("city")} />
          </div>
          <div className="field-row">
            <textarea
              placeholder="Pourquoi cette personne ? Quel sujet potentiel ?"
              value={form.reason}
              onChange={set("reason")}
              rows={4}
              style={{ width: "100%", background: "transparent", border: "none", color: "inherit", resize: "vertical" }}
            />
          </div>
          <div className="field-row">
            <input placeholder="Votre nom" value={form.proposerName} onChange={set("proposerName")} />
          </div>
          <div className="field-row">
            <input type="email" placeholder="Votre courriel" value={form.proposerEmail} onChange={set("proposerEmail")} />
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: "0.8rem", color: "var(--smoke)", margin: "12px 0" }}>
            <input type="checkbox" checked={form.consent} onChange={set("consent")} style={{ marginTop: 3 }} />
            J&apos;accepte que La Cabane du Lys me contacte au sujet de cette proposition.
          </label>
          <a
            href={canSend ? mailtoHref() : undefined}
            aria-disabled={!canSend}
            className="btn btn-solid"
            style={{ justifyContent: "center", pointerEvents: canSend ? "auto" : "none", opacity: canSend ? 1 : 0.5 }}
          >
            <Send size={16} /> Envoyer par courriel
          </a>
          <p className="auth-note">
            Ouvre votre logiciel de courriel avec les informations pré-remplies — aucune donnée n&apos;est
            stockée sur ce site.
          </p>
        </div>
      </div>
    </div>
  );
}
