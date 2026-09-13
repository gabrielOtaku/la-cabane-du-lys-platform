package com.cabanedulys.api.mail;

/** Envoi de courriels transactionnels (lien magique, confirmations). Texte brut uniquement. */
public interface MailService {

    void send(String to, String subject, String textBody);
}
