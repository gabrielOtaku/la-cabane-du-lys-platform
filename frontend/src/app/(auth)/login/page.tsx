"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Fingerprint, LogOut, MailCheck } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useLogout, useRequestMagicLink, useSession } from "@/lib/auth";
import { isApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { isValidEmail } from "@/lib/utils";

const RESEND_DELAY = 30;

function nextPath(): string {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginPage() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const requestLink = useRequestMagicLink();
  const logout = useLogout();
  const passkey = useWebAuthn();

  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendLink = (target: string) => {
    if (!isValidEmail(target)) { toast("Courriel invalide.", "Entrez une adresse valide pour recevoir votre lien."); return; }
    requestLink.mutate(target, {
      onSuccess: () => { setSentTo(target); setCooldown(RESEND_DELAY); },
      onError: (e) => {
        if (isApiError(e) && e.status === 429) toast("Trop de tentatives.", "Patientez une minute avant de redemander un lien.");
        else if (isApiError(e) && e.status === 503) toast("Envoi indisponible.", e.message);
        else toast("Envoi impossible.", e instanceof Error ? e.message : "Réessayez dans un instant.");
      },
    });
  };

  const loginWithPasskey = async () => {
    if (!passkey.supported) { toast("Passkeys non disponibles sur cet appareil.", "Utilisez le lien magique."); return; }
    const s = await passkey.login();
    if (s) { toast("Connexion réussie.", `Bienvenue, ${s.email}.`); window.location.assign(nextPath()); }
    else if (passkey.error) toast("Connexion par passkey impossible.", passkey.error);
  };

  const addPasskey = async () => {
    const ok = await passkey.register();
    if (ok) toast("Passkey ajoutée.", "Cet appareil peut désormais vous connecter sans courriel.");
    else if (passkey.error) toast("Ajout impossible.", passkey.error);
  };

  return (
    <div className="subpage">
      <div className="auth-page">
        <Link href="/" className="back-link" style={{ display: "inline-flex" }}><ArrowLeft size={16} /> Retour</Link>
        <Lys className="loader-lys" />
        <span className="eyebrow" style={{ display: "inline-flex", marginBottom: 14 }}>Le Cercle — Accès Privé</span>

        {sessionLoading && (
          <p className="lead state-note" style={{ margin: "24px auto 0" }} role="status">Vérification de la session…</p>
        )}

        {!sessionLoading && session && (
          <>
            <h1>Vous êtes<br />connecté·e.</h1>
            <p className="lead" style={{ margin: "12px auto 0" }}>{session.email}</p>
            <div className="auth">
              {passkey.supported && (
                <button type="button" className="bio-btn" onClick={addPasskey} disabled={passkey.status === "pending"}>
                  <Fingerprint size={22} strokeWidth={1.6} />
                  {passkey.status === "pending" ? "Suivez l'invite de l'appareil…" : "Ajouter une passkey sur cet appareil"}
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                style={{ justifyContent: "center" }}
                onClick={() => logout.mutate(undefined, { onSuccess: () => toast("Déconnexion effectuée.") })}
                disabled={logout.isPending}
              >
                <LogOut size={15} /> Se déconnecter
              </button>
              <p className="auth-note">Une passkey permet de revenir sans courriel, avec Face ID, Touch ID ou une clé physique.</p>
            </div>
          </>
        )}

        {!sessionLoading && !session && sentTo && (
          <>
            <MailCheck size={40} strokeWidth={1.4} style={{ color: "var(--bronze)", margin: "8px auto 0" }} aria-hidden />
            <h1>Lien envoyé.</h1>
            <p className="lead" style={{ margin: "12px auto 0" }}>
              Si <b>{sentTo}</b> est une adresse valide, un lien de connexion vient de lui être envoyé.
              Il est valable 15 minutes et ne fonctionne qu&apos;une seule fois.
            </p>
            <div className="auth">
              <button
                type="button"
                className="btn btn-ghost"
                style={{ justifyContent: "center" }}
                onClick={() => sendLink(sentTo)}
                disabled={cooldown > 0 || requestLink.isPending}
              >
                {cooldown > 0 ? `Renvoyer le lien (${cooldown}s)` : "Renvoyer le lien"}
              </button>
              <button type="button" className="gate-close" onClick={() => { setSentTo(null); setCooldown(0); }}>
                Changer d&apos;adresse
              </button>
            </div>
          </>
        )}

        {!sessionLoading && !session && !sentTo && (
          <>
            <h1>Connexion sans<br />mot de passe.</h1>
            <p className="lead" style={{ margin: "12px auto 0" }}>Recevez un lien par courriel, ou utilisez une passkey déjà enregistrée.</p>
            <form
              className="auth"
              onSubmit={(e) => { e.preventDefault(); sendLink(email.trim()); }}
            >
              <div className="field-row">
                <label htmlFor="login-email" className="sr-only">Adresse courriel</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@courriel.com"
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" className="btn btn-solid" style={{ justifyContent: "center" }} disabled={requestLink.isPending}>
                {requestLink.isPending ? "Envoi…" : "Recevoir mon lien magique"}
              </button>
              <div className="auth-or">ou</div>
              <button type="button" className="bio-btn" onClick={loginWithPasskey} disabled={passkey.status === "pending"}>
                <Fingerprint size={22} strokeWidth={1.6} />
                {passkey.status === "pending" ? "Vérification…" : "Se connecter avec une passkey"}
              </button>
              <p className="auth-note">
                La passkey s&apos;ajoute depuis cette page une fois connecté·e par lien magique.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
