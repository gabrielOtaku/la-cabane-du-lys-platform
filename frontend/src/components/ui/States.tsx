"use client";
import type { ReactNode } from "react";

/**
 * États d'interface réutilisables (feuille de route, phase 6) : chargement, erreur, vide.
 * Aucune fonction visible ne part en production sans ces trois états.
 */

export function Skeleton({ lines = 3, width = "100%" }: { lines?: number; width?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" style={{ display: "grid", gap: 10, width }}>
      <span className="sr-only">Chargement…</span>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="state-skeleton" style={{ width: `${100 - (i % 3) * 18}%` }} aria-hidden="true" />
      ))}
    </div>
  );
}

export function ErrorState({
  title = "Le serveur ne répond pas.",
  detail,
  onRetry,
  retrying = false,
}: { title?: string; detail?: string; onRetry?: () => void; retrying?: boolean }) {
  return (
    <div className="state-box" role="alert">
      <p>{title}</p>
      {detail && <span className="player-note">{detail}</span>}
      {onRetry && (
        <button type="button" className="btn btn-ghost" onClick={onRetry} disabled={retrying}>
          {retrying ? "Nouvel essai…" : "Réessayer"}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state-box" role="status">
      <p>{title}</p>
      {children}
    </div>
  );
}
