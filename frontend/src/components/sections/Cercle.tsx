"use client";
import { useState } from "react";
import { Fingerprint, Star, FileText, UserPlus } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useStore } from "@/store/useStore";
import { toast } from "@/lib/toast";
import { isValidEmail } from "@/lib/utils";

export function Cercle() {
  const [email, setEmail] = useState("");
  const { supported, register, login } = useWebAuthn();
  const setMember = useStore((s) => s.setMember);

  const sendMagic = () => {
    if (!isValidEmail(email)) { toast("Courriel invalide.", "Entrez une adresse valide pour recevoir votre lien."); return; }
    // TODO: api.post("/auth/magic-link", { email })
    toast("Lien magique envoyé.", `Vérifiez « ${email} » pour accéder au Cercle.`);
    setEmail("");
  };

  const biometric = async () => {
    if (!supported) { toast("Biométrie non disponible.", "Votre appareil ne supporte pas WebAuthn. Utilisez le lien magique."); return; }
    toast("Authentification biométrique…", "Suivez l'invite de votre appareil (Face ID / Touch ID).");
    const target = email && isValidEmail(email) ? email : "membre@cabanedulys.ca";
    const token = (await login(target)) ?? (await register(target));
    if (token) { setMember({ email: target }); toast("Bienvenue dans le Cercle.", "Votre appareil est désormais votre clé d'accès."); }
    else toast("Authentification annulée.", "Vous pouvez réessayer ou utiliser le lien magique.");
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
                <div className="mc-name"><div className="lbl">Membre</div><div className="val">Votre nom</div></div>
                <div className="mc-no">N° 0001 · 2026</div>
              </div>
            </div>
          </div>

          <div className="cercle-panel" data-reveal style={{ transitionDelay: ".12s" }}>
            <span className="eyebrow" style={{ marginBottom: 22, display: "inline-flex" }}>Le Cercle — Accès Privé</span>
            <h2 className="sec-title">Un cercle <em>fermé</em>.<br />Sur invitation.</h2>
            <p className="lead">Masterclasses exclusives, notes de podcast détaillées, et la possibilité de soumettre ta candidature pour passer à l&apos;émission.</p>
            <div className="auth">
              <div className="field-row">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@courriel.com" autoComplete="email" />
              </div>
              <button className="btn btn-solid" style={{ justifyContent: "center" }} onClick={sendMagic}>Recevoir mon lien magique</button>
              <div className="auth-or">ou</div>
              <button className="bio-btn" onClick={biometric}>
                <Fingerprint size={22} strokeWidth={1.6} />
                S&apos;identifier par biométrie · Face ID / Touch ID
              </button>
              <p className="auth-note">
                Sans mot de passe. Aucune donnée superflue.{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); toast("Connexion sans mot de passe.", "Lien magique par courriel ou biométrie — rien à retenir."); }}>Comment ça marche ?</a>
              </p>
            </div>
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
