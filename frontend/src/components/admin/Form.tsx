"use client";
import type { ReactNode } from "react";
import { isApiError } from "@/lib/api";

/** Erreurs par champ issues d'un ProblemDetail 422, plus le message global. */
export function useViolations(error: unknown): { fields: Record<string, string>; message: string | null } {
  if (!error) return { fields: {}, message: null };
  if (isApiError(error)) {
    const fields: Record<string, string> = {};
    for (const v of error.problem?.violations ?? []) {
      // "transcript[1].text" → "transcript" ; "guestIds" → "guestIds"
      const key = v.field.replace(/\[.*$/, "").replace(/\..*$/, "");
      if (!fields[key]) fields[key] = v.message;
    }
    return { fields, message: error.status === 422 ? "Certains champs sont invalides." : error.message };
  }
  return { fields: {}, message: error instanceof Error ? error.message : "Erreur inattendue." };
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  wide?: boolean;
}

export function Field({ label, htmlFor, error, hint, children, wide }: FieldProps) {
  return (
    <div className={`admin-field${wide ? " wide" : ""}${error ? " has-error" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <span className="admin-hint" id={`${htmlFor}-hint`}>{hint}</span>}
      {error && <span className="admin-error" id={`${htmlFor}-error`} role="alert">{error}</span>}
    </div>
  );
}

export function FormMessage({ message, tone = "error" }: { message: string | null; tone?: "error" | "success" }) {
  if (!message) return null;
  return <p className={`admin-message ${tone}`} role={tone === "error" ? "alert" : "status"}>{message}</p>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "danger" | "info" }) {
  return <span className={`admin-badge ${tone}`}>{children}</span>;
}

/** Instant ISO → valeur d'un <input type="datetime-local"> en heure locale. */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valeur d'un <input type="datetime-local"> (heure locale) → Instant ISO, ou null si vide. */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const money = (cents: number, currency = "CAD") =>
  (cents / 100).toLocaleString("fr-CA", { style: "currency", currency });

export const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" }) : "—";
