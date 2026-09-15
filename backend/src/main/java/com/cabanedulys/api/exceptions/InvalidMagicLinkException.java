package com.cabanedulys.api.exceptions;

/** Lien magique introuvable, expiré ou déjà utilisé — même message dans les trois cas. */
public class InvalidMagicLinkException extends RuntimeException {

    public InvalidMagicLinkException() {
        super("Ce lien de connexion est invalide, expiré ou déjà utilisé. Demandez-en un nouveau.");
    }
}
