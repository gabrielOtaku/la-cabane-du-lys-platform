"use client";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, isApiError } from "@/lib/api";
import { sessionKey } from "@/lib/auth";
import type { Session } from "@/types";

/**
 * Passkeys (WebAuthn) — méthode complémentaire au lien magique.
 *
 *  - register() : ajoute une passkey au compte de la session ouverte (adresse déjà vérifiée).
 *  - login()    : connexion sans courriel ; l'appareil propose la passkey enregistrée.
 *
 * Endpoints :
 *   POST /auth/webauthn/register/options  (session requise) -> options + challengeId
 *   POST /auth/webauthn/register/verify   (session requise) -> Session
 *   POST /auth/webauthn/login/options                       -> options + challengeId
 *   POST /auth/webauthn/login/verify                        -> Session (cookie posé par l'API)
 */

type Status = "idle" | "pending" | "success" | "error" | "unsupported";

interface RawCredentialDescriptor { type: string; id: string; }
interface RegistrationOptionsRaw {
  challengeId: string;
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: string; alg: number }[];
  timeout: number;
  attestation: string;
  authenticatorSelection: Record<string, string>;
  excludeCredentials?: RawCredentialDescriptor[];
}
interface LoginOptionsRaw {
  challengeId: string;
  challenge: string;
  rpId: string;
  allowCredentials?: RawCredentialDescriptor[];
  userVerification: string;
  timeout: number;
}

function describe(e: unknown, fallback: string): string {
  if (isApiError(e)) return e.message;
  if (e instanceof DOMException) {
    if (e.name === "NotAllowedError") return "Opération annulée ou refusée par l'appareil.";
    if (e.name === "InvalidStateError") return "Cet appareil possède déjà une passkey pour ce compte.";
    if (e.name === "SecurityError") return "Le domaine du site ne correspond pas à la configuration des passkeys.";
  }
  return e instanceof Error ? e.message : fallback;
}

const b64urlToBuf = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const bufToB64url = (b: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(b)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function useWebAuthn() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials?.create;

  /** Ajoute une passkey au compte courant. Retourne true si l'appareil est enregistré. */
  const register = useCallback(async (): Promise<boolean> => {
    if (!supported) { setStatus("unsupported"); return false; }
    setStatus("pending"); setError(null);
    try {
      const raw = await api.post<RegistrationOptionsRaw>("/auth/webauthn/register/options");
      const publicKey = {
        ...raw,
        challenge: b64urlToBuf(raw.challenge),
        user: { ...raw.user, id: b64urlToBuf(raw.user.id) },
        excludeCredentials: raw.excludeCredentials?.map((c) => ({ type: "public-key" as const, id: b64urlToBuf(c.id) })),
      } as unknown as PublicKeyCredentialCreationOptions;

      const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
      const r = cred.response as AuthenticatorAttestationResponse;

      await api.post<Session>("/auth/webauthn/register/verify", {
        challengeId: raw.challengeId,
        id: cred.id,
        rawId: bufToB64url(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: bufToB64url(r.clientDataJSON),
          attestationObject: bufToB64url(r.attestationObject),
        },
      });
      setStatus("success");
      return true;
    } catch (e) {
      setStatus("error");
      setError(describe(e, "Échec de l'enregistrement de la passkey."));
      return false;
    }
  }, [supported]);

  /** Connexion par passkey. Retourne la session ouverte, ou null. */
  const login = useCallback(async (): Promise<Session | null> => {
    if (!supported) { setStatus("unsupported"); return null; }
    setStatus("pending"); setError(null);
    try {
      const raw = await api.post<LoginOptionsRaw>("/auth/webauthn/login/options");
      const publicKey = {
        ...raw,
        challenge: b64urlToBuf(raw.challenge),
        allowCredentials: raw.allowCredentials?.map((c) => ({ type: "public-key" as const, id: b64urlToBuf(c.id) })),
      } as unknown as PublicKeyCredentialRequestOptions;
      const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential;
      const r = assertion.response as AuthenticatorAssertionResponse;
      const session = await api.post<Session>("/auth/webauthn/login/verify", {
        challengeId: raw.challengeId,
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
      qc.setQueryData(sessionKey, session);
      setStatus("success");
      return session;
    } catch (e) {
      setStatus("error");
      setError(describe(e, "Échec de la connexion par passkey."));
      return null;
    }
  }, [supported, qc]);

  return { supported, status, error, register, login };
}
