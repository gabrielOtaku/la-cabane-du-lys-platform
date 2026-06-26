"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { products } from "@/data/products";
import { toast } from "@/lib/toast";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { TiltEffects } from "@/components/layout/TiltEffects";

function useCountdown(target: Date) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { 
    setMounted(true);
    const id = setInterval(() => setNow(Date.now()), 1000); 
    return () => clearInterval(id); 
  }, []);
  const s = Math.max(0, Math.floor((target.getTime() - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return { mounted, d: pad(Math.floor(s / 86400)), h: pad(Math.floor((s % 86400) / 3600)), m: pad(Math.floor((s % 3600) / 60)), s: pad(s % 60) };
}

export default function DropPage() {
  const target = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 18); d.setHours(20, 0, 0, 0); return d; }, []);
  const cd = useCountdown(target);

  const checkout = (name: string) => {
    // TODO: api.post("/shop/checkout", { productId }) -> Stripe Checkout Session -> redirection
    toast("Paiement à brancher.", `« ${name} » — intégrez l'API Stripe (PaymentIntent / Checkout) côté backend.`);
  };

  return (
    <div className="subpage">
      <div className="container">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Retour à l&apos;Édifice</Link>
        <div className="page-head">
          <div className="seal" data-reveal style={{ margin: "0 auto" }}><Lys /></div>
          <span className="eyebrow center">La Réserve — Drop éphémère</span>
          <h2 className="sec-title">Prochaine ouverture<br /><em>scellée</em>.</h2>
          <p className="lead">Pas de vente de masse. Quelques pièces, numérotées, le temps d&apos;un Drop. Voici l&apos;avant-goût.</p>
        </div>

      <div className="countdown" style={{ margin: "40px auto" }}>
          <div className="cd-unit"><b>{cd.mounted ? cd.d : "00"}</b><span>Jours</span></div><div className="cd-sep">:</div>
          <div className="cd-unit"><b>{cd.mounted ? cd.h : "00"}</b><span>Heures</span></div><div className="cd-sep">:</div>
          <div className="cd-unit"><b>{cd.mounted ? cd.m : "00"}</b><span>Min</span></div><div className="cd-sep">:</div>
          <div className="cd-unit"><b>{cd.mounted ? cd.s : "00"}</b><span>Sec</span></div>
        </div>

        <div className="diff-grid" style={{ paddingBottom: "8rem" }}>
          {products.map((p) => (
            <div key={p.id} className="diff-card prod" data-tilt>
              <div className="ep-num">{p.edition}</div>
              <h4>{p.name}</h4>
              <p>{p.tagline}</p>
              <div className="ep-foot" style={{ marginTop: 18 }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: "1.1rem", color: "var(--gold)" }}>
                  {(p.priceCents / 100).toLocaleString("fr-CA", { style: "currency", currency: p.currency })}
                </span>
                <button className="btn btn-ghost" disabled={!p.available} onClick={() => checkout(p.name)} style={{ opacity: p.available ? 1 : 0.65 }}>
                  <Lock size={14} /> {p.available ? "Acheter" : "Scellé"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ScrollReveal />
      <TiltEffects />
    </div>
  );
}