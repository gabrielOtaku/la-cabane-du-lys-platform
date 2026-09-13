"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Lys } from "@/components/ui/Lys";
import { useOrderStatus } from "@/lib/queries";

function SuccessInner() {
  const orderId = useSearchParams().get("order");
  const { data, isLoading, isError } = useOrderStatus(orderId);

  const status = data?.status;

  return (
    <div className="subpage">
      <div className="auth-page">
        <Link href="/drop" className="back-link" style={{ display: "inline-flex" }}><ArrowLeft size={16} /> La Réserve</Link>
        <Lys className="loader-lys" />
        <span className="eyebrow" style={{ display: "inline-flex", marginBottom: 14 }}>La Réserve — Commande</span>

        {!orderId && (
          <>
            <h1>Commande introuvable.</h1>
            <p className="lead" style={{ margin: "12px auto 0" }}>Ce lien ne contient pas de référence de commande.</p>
          </>
        )}

        {orderId && (isLoading || status === "PENDING") && (
          <>
            <h1>Confirmation<br />en cours…</h1>
            <p className="lead state-note" style={{ margin: "12px auto 0" }} role="status" aria-live="polite">
              Nous attendons la confirmation du paiement. Cela prend habituellement quelques secondes.
            </p>
          </>
        )}

        {orderId && isError && (
          <>
            <h1>Commande introuvable.</h1>
            <p className="lead" style={{ margin: "12px auto 0" }} role="alert">
              Cette référence ne correspond à aucune commande. Si vous avez été débité·e, écrivez-nous en indiquant la référence ci-dessous.
            </p>
          </>
        )}

        {status === "PAID" || status === "FULFILLED" ? (
          <>
            <h1>Merci.<br />C&apos;est réservé.</h1>
            <p className="lead" style={{ margin: "12px auto 0" }} role="status" aria-live="polite">
              Votre paiement est confirmé. Un courriel de Stripe fait office de reçu.
            </p>
          </>
        ) : null}

        {(status === "EXPIRED" || status === "CANCELLED") && (
          <>
            <h1>Réservation<br />expirée.</h1>
            <p className="lead" style={{ margin: "12px auto 0" }} role="alert">
              La fenêtre de paiement est passée et la pièce a été remise en vente. Vous pouvez recommencer depuis La Réserve.
            </p>
          </>
        )}

        {status === "PAYMENT_MISMATCH" && (
          <>
            <h1>Paiement<br />à vérifier.</h1>
            <p className="lead" style={{ margin: "12px auto 0" }} role="alert">
              Le montant reçu ne correspond pas à la commande. Nous vérifions manuellement et vous écrirons rapidement.
            </p>
          </>
        )}

        {orderId && (
          <p className="auth-note" style={{ marginTop: 28 }}>Référence : <code>{orderId}</code></p>
        )}
      </div>
    </div>
  );
}

export default function DropSuccessPage() {
  return (
    <Suspense fallback={<div className="subpage"><div className="auth-page"><p className="lead state-note">Un instant…</p></div></div>}>
      <SuccessInner />
    </Suspense>
  );
}
