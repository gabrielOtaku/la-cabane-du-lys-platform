"use client";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";

/**
 * Authentification sans mot de passe (WebAuthn / Passkeys).
 * Le navigateur réalise la ceremony ; le backend Spring Boot fournit
 * les options (challenge) et vérifie l'attestation/assertion.
 *
 * Endpoints attendus côté API :
 *   POST /auth/webauthn/register/options   -> PublicKeyCredentialCreationOptions
 *   POST /auth/webauthn/register/verify    -> { token }
 *   POST /auth/webauthn/login/options      -> PublicKeyCredentialRequestOptions
 *   POST /auth/webauthn/login/verify       -> { token }
 */

type Status = "idle" | "pending" | "success" | "error" | "unsupported";

const b64urlToBuf = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const bufToB64url = (b: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(b)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function useWebAuthn() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials?.create;

  const register = useCallback(async (email: string) => {
    if (!supported) { setStatus("unsupported"); return null; }
    setStatus("pending"); setError(null);
    try {
      // 1) options serveur
      const opts: any = await api.post("/auth/webauthn/register/options", { email });
      opts.challenge = b64urlToBuf(opts.challenge);
      opts.user.id = b64urlToBuf(opts.user.id);

      // 2) ceremony navigateur (FaceID / TouchID / clé physique)
      const cred = (await navigator.credentials.create({ publicKey: opts })) as PublicKeyCredential;
      const r = cred.response as AuthenticatorAttestationResponse;

      // 3) vérification serveur
      const { token } = await api.post<{ token: string }>("/auth/webauthn/register/verify", {
        email,
        id: cred.id,
        rawId: bufToB64url(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: bufToB64url(r.clientDataJSON),
          attestationObject: bufToB64url(r.attestationObject),
        },
      });
      setStatus("success");
      return token;
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? "Échec de l'enregistrement biométrique.");
      return null;
    }
  }, [supported]);

  const login = useCallback(async (email: string) => {
    if (!supported) { setStatus("unsupported"); return null; }
    setStatus("pending"); setError(null);
    try {
      const opts: any = await api.post("/auth/webauthn/login/options", { email });
      opts.challenge = b64urlToBuf(opts.challenge);
      if (opts.allowCredentials) {
        opts.allowCredentials = opts.allowCredentials.map((c: any) => ({ ...c, id: b64urlToBuf(c.id) }));
      }
      const assertion = (await navigator.credentials.get({ publicKey: opts })) as PublicKeyCredential;
      const r = assertion.response as AuthenticatorAssertionResponse;
      const { token } = await api.post<{ token: string }>("/auth/webauthn/login/verify", {
        email,
        id: assertion.id,
        rawId: bufToB64url(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: bufToB64url(r.clientDataJSON),
          authenticatorData: bufToB64url(r.authenticatorData),
          signature: bufToB64url(r.signature),
          userHandle: r.userHandle ? bufToB64url(r.userHandle) : null,
        },
      });
      setStatus("success");
      return token;
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? "Échec de l'authentification.");
      return null;
    }
  }, [supported]);

  return { supported, status, error, register, login };
}
