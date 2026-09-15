"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, ShoppingBag } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { TiltEffects } from "@/components/layout/TiltEffects";
import { useCountdown } from "@/hooks/useCountdown";
import { useCheckout, useDrop } from "@/lib/queries";
import { useSession } from "@/lib/auth";
import { isApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { Product } from "@/types";

const money = (cents: number, currency: string) =>
  (cents / 100).toLocaleString("fr-CA", { style: "currency", currency });

const when = (iso: string) =>
  new Date(iso).toLocaleString("fr-CA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default function DropPage() {
  const router = useRouter();
  const { data: drop, isLoading, isError, refetch, isFetching } = useDrop();
  const { data: session } = useSession();
  const checkout = useCheckout();

  const target = drop?.status === "SCHEDULED" && drop.opensAt ? new Date(drop.opensAt) : null;
  const cd = useCountdown(target);

  // Le compte à rebours atteint zéro : on relit l'état serveur, qui passe à OPEN.
  useEffect(() => {
    if (cd.expired) void refetch();
  }, [cd.expired, refetch]);

  const buy = (p: Product) => {
    if (!session) {
      toast("Connexion requise.", "Connectez-vous pour réserver une pièce de La Réserve.");
      router.push("/login?next=/drop");
      return;
    }
    checkout.mutate({ productId: p.id, quantity: 1 }, {
      onSuccess: (r) => { window.location.assign(r.checkoutUrl); },
      onError: (e) => {
        if (isApiError(e) && e.status === 401) { router.push("/login?next=/drop"); return; }
        if (isApiError(e) && e.code === "sold-out") { toast("Trop tard.", e.message); void refetch(); return; }
        toast("Réservation impossible.", isApiError(e) ? e.message : "Réessayez dans un instant.");
      },
    });
  };

  return (
    <div className="subpage">
      <div className="container">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Retour à l&apos;Édifice</Link>

        <div className="page-head">
          <div className="seal" data-reveal style={{ margin: "0 auto" }}><Lys /></div>
          <span className="eyebrow center">La Réserve — Drop éphémère</span>

          {isLoading && (
            <p className="lead state-note" role="status" style={{ margin: "18px auto 0" }}>Chargement de La Réserve…</p>
          )}

          {isError && (
            <div className="state-box" role="alert">
              <p>La Réserve ne répond pas pour le moment.</p>
              <button type="button" className="btn btn-ghost" onClick={() => refetch()} disabled={isFetching}>Réessayer</button>
            </div>
          )}

          {drop && drop.status === "NONE" && (
            <>
              <h2 className="sec-title">Aucun drop<br /><em>programmé</em>.</h2>
              <p className="lead">Pas de vente de masse. Quelques pièces, numérotées, le temps d&apos;un Drop. Le prochain sera annoncé ici et sur nos plateformes.</p>
            </>
          )}

          {drop && drop.status === "SCHEDULED" && (
            <>
              <h2 className="sec-title">{drop.title ?? "Prochaine ouverture"}<br /><em>scellée</em>.</h2>
              <p className="lead">{drop.subtitle ?? "Quelques pièces, numérotées, le temps d'un Drop."}{drop.opensAt && <> Ouverture le {when(drop.opensAt)}.</>}</p>
            </>
          )}

          {drop && drop.status === "OPEN" && (
            <>
              <h2 className="sec-title">{drop.title ?? "La Réserve"}<br /><em>est ouverte</em>.</h2>
              <p className="lead">
                {drop.subtitle ?? "Quelques pièces, numérotées, le temps d'un Drop."}
                {drop.closesAt && <> Fermeture le {when(drop.closesAt)}.</>}
                {drop.maxPerCustomer > 0 && <> Limite de {drop.maxPerCustomer} par client.</>}
              </p>
            </>
          )}

          {drop && drop.status === "CLOSED" && (
            <>
              <h2 className="sec-title">{drop.title ?? "Ce drop"}<br /><em>est terminé</em>.</h2>
              <p className="lead">Merci à celles et ceux qui ont bâti avec nous. Le prochain drop sera annoncé ici.</p>
            </>
          )}
        </div>

        {drop?.status === "SCHEDULED" && (
          <div className="countdown" style={{ margin: "40px auto" }} role="timer" aria-live="off" aria-label="Temps restant avant l'ouverture">
            <div className="cd-unit"><b>{cd.d}</b><span>Jours</span></div><div className="cd-sep">:</div>
            <div className="cd-unit"><b>{cd.h}</b><span>Heures</span></div><div className="cd-sep">:</div>
            <div className="cd-unit"><b>{cd.m}</b><span>Min</span></div><div className="cd-sep">:</div>
            <div className="cd-unit"><b>{cd.s}</b><span>Sec</span></div>
          </div>
        )}

        {drop && drop.products.length > 0 && (
          <div className="diff-grid" style={{ paddingBottom: "8rem" }}>
            {drop.products.map((p) => {
              const open = drop.status === "OPEN";
              const label = !open ? "Scellé" : p.available ? "Réserver" : "Épuisé";
              return (
                <div key={p.id} className="diff-card prod" data-tilt>
                  <div className="ep-num">{p.edition}</div>
                  <h4>{p.name}</h4>
                  <p>{p.tagline}</p>
                  {open && p.available && p.remaining <= 5 && (
                    <p className="prod-remaining">Plus que {p.remaining} exemplaire{p.remaining > 1 ? "s" : ""}.</p>
                  )}
                  <div className="ep-foot" style={{ marginTop: 18 }}>
                    <span style={{ fontFamily: "var(--serif)", fontSize: "1.1rem", color: "var(--gold)" }}>
                      {money(p.priceCents, p.currency)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={!open || !p.available || checkout.isPending}
                      aria-disabled={!open || !p.available}
                      onClick={() => buy(p)}
                      style={{ opacity: open && p.available ? 1 : 0.65 }}
                    >
                      {open && p.available ? <ShoppingBag size={14} /> : <Lock size={14} />} {checkout.isPending ? "Réservation…" : label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ScrollReveal />
      <TiltEffects />
    </div>
  );
}
