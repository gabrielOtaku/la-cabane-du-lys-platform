package com.cabanedulys.api.models;

/**
 * ACTIVE retient du stock ; CONFIRMED a été payée (stock décrémenté) ;
 * RELEASED a été libérée volontairement ; EXPIRED a été libérée par le temps.
 */
public enum ReservationStatus { ACTIVE, CONFIRMED, RELEASED, EXPIRED }
