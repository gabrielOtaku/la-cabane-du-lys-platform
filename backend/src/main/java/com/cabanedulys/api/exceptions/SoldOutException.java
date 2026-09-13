package com.cabanedulys.api.exceptions;

/** Stock insuffisant au moment de la réservation, ou limite par client atteinte. */
public class SoldOutException extends RuntimeException {

    public SoldOutException(String message) {
        super(message);
    }
}
