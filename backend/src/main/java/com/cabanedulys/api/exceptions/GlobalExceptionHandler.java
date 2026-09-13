package com.cabanedulys.api.exceptions;

import com.cabanedulys.api.mail.MailDeliveryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * Gestion globale des erreurs — format RFC 7807 (ProblemDetail).
 * Les réponses sont standardisées et parsables par n'importe quel client.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String BASE_TYPE = "https://cabanedulys.ca/errors/";

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Resource Not Found", ex.getMessage(), "not-found");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ProblemDetail handleConflict(IllegalStateException ex) {
        return problem(HttpStatus.CONFLICT, "Conflict", ex.getMessage(), "conflict");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleBadRequest(IllegalArgumentException ex) {
        return problem(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), "bad-request");
    }

    @ExceptionHandler(FeatureDisabledException.class)
    public ProblemDetail handleFeatureDisabled(FeatureDisabledException ex) {
        return problem(HttpStatus.SERVICE_UNAVAILABLE, "Feature Disabled", ex.getMessage(), "feature-disabled");
    }

    @ExceptionHandler(MailDeliveryException.class)
    public ProblemDetail handleMail(MailDeliveryException ex) {
        return problem(HttpStatus.SERVICE_UNAVAILABLE, "Mail Unavailable", ex.getMessage(), "mail-unavailable");
    }

    @ExceptionHandler(InvalidMagicLinkException.class)
    public ProblemDetail handleInvalidMagicLink(InvalidMagicLinkException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Invalid Magic Link", ex.getMessage(), "magic-link-invalid");
    }

    @ExceptionHandler(SoldOutException.class)
    public ProblemDetail handleSoldOut(SoldOutException ex) {
        return problem(HttpStatus.CONFLICT, "Sold Out", ex.getMessage(), "sold-out");
    }

    @ExceptionHandler(PaymentUnavailableException.class)
    public ProblemDetail handlePayment(PaymentUnavailableException ex) {
        return problem(HttpStatus.SERVICE_UNAVAILABLE, "Payment Unavailable", ex.getMessage(), "payment-unavailable");
    }

    /** Échec d'une règle {@code @PreAuthorize} à l'intérieur d'un contrôleur. */
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        return problem(HttpStatus.FORBIDDEN, "Forbidden",
                "Vous n'avez pas les droits nécessaires pour cette action.", "forbidden");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentification requise.", "unauthorized");
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        log.error("Erreur non gérée : {}", ex.toString(), ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "Une erreur inattendue est survenue.", "internal");
    }

    /** Validation Jakarta Bean Validation — liste les violations par champ. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        List<Map<String, String>> violations = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> Map.of("field", e.getField(), "message",
                        e.getDefaultMessage() != null ? e.getDefaultMessage() : "invalide"))
                .toList();

        ProblemDetail pd = problem(HttpStatus.UNPROCESSABLE_ENTITY, "Validation Failed",
                "La validation des données a échoué.", "validation");
        pd.setProperty("violations", violations);

        return ResponseEntity.unprocessableEntity().body(pd);
    }

    private static ProblemDetail problem(HttpStatus status, String title, String detail, String typeSlug) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        pd.setType(URI.create(BASE_TYPE + typeSlug));
        return pd;
    }
}
