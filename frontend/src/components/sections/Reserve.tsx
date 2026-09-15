"use client";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { useCountdown } from "@/hooks/useCountdown";
import { useDrop } from "@/lib/queries";
import { PLATFORM_LINKS } from "@/lib/platforms";

/**
 * Teaser « La Réserve » — non rendu sur l'accueil public tant que la boutique n'est pas lancée
 * (AUDIT_CHECKLIST). Branché sur le drop réel : aucune date inventée, aucune fausse inscription.
 */
const veils = [
  { label: "Vêtement brodé", icon: <svg viewBox="0 0 64 64"><path d="M20 8h24l-3 14H23z" /><path d="M23 22v34h18V22" /></svg> },
  { label: "Carnet cuir véritable", icon: <svg viewBox="0 0 64 64"><rect x="16" y="12" width="32" height="40" rx="3" /><line x1="24" y1="22" x2="40" y2="22" /><line x1="24" y1="30" x2="40" y2="30" /></svg> },
  { label: "Accès VIP — événement", icon: <svg viewBox="0 0 64 64"><circle cx="32" cy="26" r="14" /><path d="M20 52l4-12M44 52l-4-12" /></svg> },
];

export function Reserve() {
  const { data: drop } = useDrop();
  const target = drop?.status === "SCHEDULED" && drop.opensAt ? new Date(drop.opensAt) : null;
  const cd = useCountdown(target);

  const headline = drop?.status === "OPEN"
    ? <>La boutique est <em>ouverte</em>.</>
    : drop?.status === "SCHEDULED"
      ? <>La boutique est <em>scellée</em>.</>
      : <>Aucun drop <em>programmé</em>.</>;

  return (
    <section id="reserve" className="reserve">
      <div className="container">
        <div className="seal" data-reveal><Lys /></div>
        <span className="eyebrow center" data-reveal>La Réserve</span>
        <h2 className="sec-title" data-reveal style={{ margin: "18px auto 0" }}>{headline}</h2>
        <p className="lead" data-reveal style={{ margin: "18px auto 0", textAlign: "center" }}>
          Elle n&apos;ouvre que pour de rares Drops — éditions limitées, numérotées.
        </p>

        {drop?.status === "SCHEDULED" && (
          <div className="countdown" data-reveal role="timer" aria-label="Temps restant avant l'ouverture">
            <div className="cd-unit"><b>{cd.d}</b><span>Jours</span></div><div className="cd-sep">:</div>
            <div className="cd-unit"><b>{cd.h}</b><span>Heures</span></div><div className="cd-sep">:</div>
            <div className="cd-unit"><b>{cd.m}</b><span>Min</span></div><div className="cd-sep">:</div>
            <div className="cd-unit"><b>{cd.s}</b><span>Sec</span></div>
          </div>
        )}

        <div className="veil-grid" data-reveal>
          {veils.map((v) => (
            <div key={v.label} className="veil">
              <div className="relic-mini">{v.icon}</div>
              <div className="lock"><Lock size={24} strokeWidth={1.6} /><span>Scellé</span></div>
              <div className="px">{v.label}</div>
            </div>
          ))}
        </div>

        <div className="notify" data-reveal style={{ justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          {drop?.status === "OPEN" ? (
            <Link href="/drop" className="btn btn-solid">Entrer dans La Réserve</Link>
          ) : (
            <a href={PLATFORM_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Être averti du prochain Drop sur YouTube
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
