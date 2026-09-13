package com.cabanedulys.api.mail;

/** Le transport de courriel a échoué : l'appelant reçoit un 503 explicite plutôt qu'un faux succès. */
public class MailDeliveryException extends RuntimeException {

    public MailDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
