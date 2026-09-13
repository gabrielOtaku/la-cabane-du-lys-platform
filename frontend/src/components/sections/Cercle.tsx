"use client";
import { useState } from "react";
import Link from "next/link";
import { Fingerprint, Star, FileText, UserPlus } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useRequestMagicLink, useSession } from "@/lib/auth";
import { isApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { isValidEmail } from "@/lib/utils";

/**
 * Section « Le Cercle » — non rendue sur l'accueil public tant que l'offre membre n'est pas
 * définie (AUDIT_CHECKLIST P3). Branchée sur le vrai flux de connexion pour rester compilable
 * et testable : lien magique réel, passkey sans adresse de repli.
 */
export function Cercle() {
  const [email, setEmail] = useState("");
  const { data: session } = useSession();
  const requestLink = useRequestMagicLink();
  const passkey = useWebAuthn();

  const sendMagic = () => {
    if (!isValidEmail(email)) { toast("Courriel invalide.", "Entrez une adresse valide pour recevoir votre lien."); return; }
    requestLink.mutate(email, {
      onSuccess: () => { toast("Lien envoyé.", `Si « ${email} » est valide, consultez votre boîte de réception.`); setEmail(""); },
      onError: (e) => toast("Envoi impossible.", isApiError(e) ? e.message : "Réessayez dans un instant."),
    });
  };

  const biometric = async () => {
    if (!passkey.supported) { toast("Passkeys non disponibles.", "Votre appareil ne supporte pas WebAuthn. Utilisez le lien magique."); return; }
    const s = await passkey.login();
    if (s) toast("Bienvenue dans le Cercle.", s.email);
    else toast("Connexion annulée.", passkey.error ?? "Vous pouvez réessayer ou utiliser le lien magique.");
  };

  return (
    <section id="cercle" className="cercle">
      <div className="container">
        <div className="cercle-grid">
          <div className="card-stage" data-reveal>
            <div className="member-card" id="memberCard">
              <div className="mc-top">
                <Lys />
                <div className="mc-tier">Cercle Privé<b>Fondateur</b></div>
              </div>
              <div className="mc-chip" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div className="mc-name"><div className="lbl">Membre</div><div className="val">{session?.email ?? "Votre nom"}</div></div>
                <div className="mc-no">N° 0001 · 2026</div>
              </div>
            </div>
          </div>

          <div className="cercle-panel" data-reveal style={{ transitionDelay: ".12s" }}>
            <span className="eyebrow" style={{ marginBottom: 22, display: "inline-flex" }}>Le Cercle — Accès Privé</span>
            <h2 className="sec-title">Un cercle <em>fermé</em>.<br />Sur invitation.</h2>
            <p className="lead">Masterclasses exclusives, notes de podcast détaillées, et la possibilité de soumettre ta candidature pour passer à l&apos;émission.</p>
            {session ? (
              <div className="auth">
                <p className="auth-note">Connecté·e en tant que {session.email}. <Link href="/login">Gérer ma connexion</Link></p>
              </div>
            ) : (
              <div className="auth">
                <div className="field-row">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@courriel.com" autoComplete="email" aria-label="Adresse courriel" />
                </div>
                <button className="btn btn-solid" style={{ justifyContent: "center" }} onClick={sendMagic} disabled={requestLink.isPending}>
                  {requestLink.isPending ? "Envoi…" : "Recevoir mon lien magique"}
                </button>
                <div className="auth-or">ou</div>
                <button className="bio-btn" onClick={biometric} disabled={passkey.status === "pending"}>
                  <Fingerprint size={22} strokeWidth={1.6} />
                  Se connecter avec une passkey
                </button>
                <p className="auth-note">Sans mot de passe. Aucune donnée superflue.</p>
              </div>
            )}
            <div className="perks">
              <div className="perk"><Star size={24} strokeWidth={1.6} /><div><b>Masterclasses exclusives</b><p>Du contenu de fond réservé aux membres du Cercle.</p></div></div>
              <div className="perk"><FileText size={24} strokeWidth={1.6} /><div><b>Notes de podcast détaillées</b><p>Les ressources, chiffres et références de chaque épisode.</p></div></div>
              <div className="perk"><UserPlus size={24} strokeWidth={1.6} /><div><b>Candidature pour passer à l&apos;émission</b><p>Présente ton parcours. Les meilleurs profils sont contactés.</p></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
