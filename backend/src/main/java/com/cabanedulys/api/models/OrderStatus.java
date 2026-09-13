package com.cabanedulys.api.models;

/**
 * PENDING : réservation posée, paiement en cours · PAID : webhook confirmé · FULFILLED : expédiée ·
 * CANCELLED : annulée (ex. Stripe injoignable) · EXPIRED : session de paiement expirée ·
 * PAYMENT_MISMATCH : montant reçu différent du montant attendu, à vérifier manuellement.
 */
public enum OrderStatus { PENDING, PAID, FULFILLED, CANCELLED, EXPIRED, PAYMENT_MISMATCH }
