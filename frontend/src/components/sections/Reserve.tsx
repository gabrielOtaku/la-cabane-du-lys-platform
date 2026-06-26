"use client";
import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { toast } from "@/lib/toast";
import { isValidEmail } from "@/lib/utils";
import { useDrop } from "@/lib/queries";

function useCountdown(target: Date) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target.getTime() - now);
  const s = Math.floor(diff / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    mounted, // On retourne cet état
    d: pad(Math.floor(s / 86400)),
    h: pad(Math.floor((s % 86400) / 3600)),
    m: pad(Math.floor((s % 3600) / 60)),
    s: pad(s % 60),
  };
}

const veils = [
  { label: "Vêtement brodé", icon: <svg viewBox="0 0 64 64"><path d="M20 8h24l-3 14H23z" /><path d="M23 22v34h18V22" /></svg> },
  { label: "Carnet cuir véritable", icon: <svg viewBox="0 0 64 64"><rect x="16" y="12" width="32" height="40" rx="3" /><line x1="24" y1="22" x2="40" y2="22" /><line x1="24" y1="30" x2="40" y2="30" /></svg> },
  { label: "Accès VIP — événement", icon: <svg viewBox="0 0 64 64"><circle cx="32" cy="26" r="14" /><path d="M20 52l4-12M44 52l-4-12" /></svg> },
];

export function Reserve() {
  const [email, setEmail] = useState("");
  const { data: drop } = useDrop();

  // Fallback : +18 jours si l'API n'a pas encore répondu
  const target = useMemo(() => {
    if (drop?.opensAt) return new Date(drop.opensAt);
    const d = new Date();
    d.setDate(d.getDate() + 18);
    d.setHours(20, 0, 0, 0);
    return d;
  }, [drop?.opensAt]);

  const cd = useCountdown(target);

  const notify = () => {
    if (!isValidEmail(email)) { toast("Courriel invalide.", "Entrez une adresse pour être prévenu du prochain Drop."); return; }
    toast("Vous êtes sur la liste.", "Vous serez prévenu·e en priorité dès l'ouverture de La Réserve.");
    setEmail("");
  };

  return (
    <section id="reserve" className="reserve">
      <div className="container">
        <div className="seal" data-reveal><Lys /></div>
        <span className="eyebrow center" data-reveal>La Réserve</span>
        <h2 className="sec-title" data-reveal style={{ margin: "18px auto 0" }}>La boutique est <em>scellée</em>.</h2>
        <p className="lead" data-reveal style={{ margin: "18px auto 0", textAlign: "center" }}>
          Elle n&apos;ouvre que pour de rares Drops — éditions limitées, numérotées. Le prochain approche.
        </p>

      <div className="countdown" data-reveal>
          <div className="cd-unit"><b>{cd.mounted ? cd.d : "00"}</b><span>Jours</span></div><div className="cd-sep">:</div>
          <div className="cd-unit"><b>{cd.mounted ? cd.h : "00"}</b><span>Heures</span></div><div className="cd-sep">:</div>
          <div className="cd-unit"><b>{cd.mounted ? cd.m : "00"}</b><span>Min</span></div><div className="cd-sep">:</div>
          <div className="cd-unit"><b>{cd.mounted ? cd.s : "00"}</b><span>Sec</span></div>
        </div>
        <div className="veil-grid" data-reveal>
          {veils.map((v) => (
            <div key={v.label} className="veil">
              <div className="relic-mini">{v.icon}</div>
              <div className="lock"><Lock size={24} strokeWidth={1.6} /><span>Scellé</span></div>
              <div className="px">{v.label}</div>
            </div>
          ))}
        </div>

        <div className="notify" data-reveal>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@courriel.com" />
          <button className="btn btn-ghost" style={{ borderColor: "rgba(227,184,120,.5)" }} onClick={notify}>Me prévenir du Drop</button>
        </div>
      </div>
    </section>
  );
}