package com.cabanedulys.api.exceptions;

/** Le prestataire de paiement n'a pas pu créer la session : la réservation a été libérée. */
public class PaymentUnavailableException extends RuntimeException {

    public PaymentUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
