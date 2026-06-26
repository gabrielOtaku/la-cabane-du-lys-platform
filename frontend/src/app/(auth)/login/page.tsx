"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Fingerprint } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useStore } from "@/store/useStore";
import { toast } from "@/lib/toast";
import { isValidEmail } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const { supported, status, register, login } = useWebAuthn();
  const setMember = useStore((s) => s.setMember);

  const magic = () => {
    if (!isValidEmail(email)) { toast("Courriel invalide."); return; }
    toast("Lien magique envoyé.", `Consultez « ${email} » pour vous connecter.`);
  };
  const biometric = async () => {
    if (!supported) { toast("Biométrie non disponible sur cet appareil."); return; }
    const target = isValidEmail(email) ? email : "membre@cabanedulys.ca";
    const token = (await login(target)) ?? (await register(target));
    if (token) { setMember({ email: target }); toast("Connexion réussie.", "Bienvenue dans le Cercle."); }
    else toast("Connexion annulée.");
  };

  return (
    <div className="subpage">
      <div className="auth-page">
        <Link href="/" className="back-link" style={{ display: "inline-flex" }}><ArrowLeft size={16} /> Retour</Link>
        <Lys className="loader-lys" />
        <span className="eyebrow" style={{ display: "inline-flex", marginBottom: 14 }}>Le Cercle — Accès Privé</span>
        <h1>Connexion sans<br />mot de passe.</h1>
        <p className="lead" style={{ margin: "12px auto 0" }}>Votre appareil devient votre clé. Aucun mot de passe, aucune fuite possible.</p>
        <div className="auth">
          <div className="field-row">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@courriel.com" autoComplete="email" />
          </div>
          <button className="btn btn-solid" style={{ justifyContent: "center" }} onClick={magic}>Recevoir mon lien magique</button>
          <div className="auth-or">ou</div>
          <button className="bio-btn" onClick={biometric} disabled={status === "pending"}>
            <Fingerprint size={22} strokeWidth={1.6} />
            {status === "pending" ? "Vérification…" : "S'identifier par biométrie · Face ID / Touch ID"}
          </button>
          <p className="auth-note">Protocole WebAuthn (Passkeys) · conforme niveau bancaire.</p>
        </div>
      </div>
    </div>
  );
}
