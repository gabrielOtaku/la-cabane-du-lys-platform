package com.cabanedulys.api.dto;

/** URL de redirection Stripe Checkout + référence de commande. */
public record CheckoutResponse(String checkoutUrl, String reference) {}
