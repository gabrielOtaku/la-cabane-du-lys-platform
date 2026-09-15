"use client";
import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lys } from "@/components/ui/Lys";
import { useVerifyMagicLink } from "@/lib/auth";
import { isApiError } from "@/lib/api";

/** Destination après connexion : uniquement un chemin interne. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const next = safeNext(params.get("next"));
  const verify = useVerifyMagicLink();
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // React Strict Mode rejoue les effets : un jeton ne se vérifie qu'une fois.
    verify.mutate(token, {
      onSuccess: () => { setTimeout(() => router.replace(next), 900); },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const expiredOrUsed = verify.isError && isApiError(verify.error) && verify.error.status === 401;

  return (
    <div className="subpage">
      <div className="auth-page">
        <Lys className="loader-lys" />
        <span className="eyebrow" style={{ display: "inline-flex", marginBottom: 14 }}>Le Cercle — Connexion</span>

        {!token && (
          <>
            <h1>Lien incomplet.</h1>
            <p className="lead" style={{ margin: "12px auto 0" }}>
              Ce lien ne contient pas de jeton. Ouvrez le lien complet reçu par courriel ou demandez-en un nouveau.
            </p>
            <div className="auth"><Link href="/login" className="btn btn-solid" style={{ justifyContent: "center" }}>Demander un nouveau lien</Link></div>
          </>
        )}

        {token && (verify.isPending || verify.isIdle) && (
          <>
            <h1>Vérification<br />du lien…</h1>
            <p className="lead state-note" style={{ margin: "12px auto 0" }} role="status" aria-live="polite">Un instant.</p>
          </>
        )}

        {token && verify.isSuccess && (
          <>
            <h1>Bienvenue.</h1>
            <p className="lead" style={{ margin: "12px auto 0" }} role="status" aria-live="polite">
              Connexion réussie pour {verify.data.email}. Redirection en cours…
            </p>
          </>
        )}

        {token && verify.isError && (
          <>
            <h1>{expiredOrUsed ? "Lien expiré ou déjà utilisé." : "Connexion impossible."}</h1>
            <p className="lead" style={{ margin: "12px auto 0" }} role="alert">
              {expiredOrUsed
                ? "Chaque lien ne fonctionne qu'une fois et pendant 15 minutes. Demandez-en un nouveau."
                : verify.error instanceof Error ? verify.error.message : "Réessayez dans un instant."}
            </p>
            <div className="auth"><Link href="/login" className="btn btn-solid" style={{ justifyContent: "center" }}>Demander un nouveau lien</Link></div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={<div className="subpage"><div className="auth-page"><p className="lead state-note">Un instant…</p></div></div>}>
      <CallbackInner />
    </Suspense>
  );
}
