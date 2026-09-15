package com.cabanedulys.api.services;

import com.cabanedulys.api.exceptions.FeatureDisabledException;
import com.cabanedulys.api.exceptions.InvalidMagicLinkException;
import com.cabanedulys.api.mail.MailService;
import com.cabanedulys.api.models.MagicLinkToken;
import com.cabanedulys.api.models.Role;
import com.cabanedulys.api.models.User;
import com.cabanedulys.api.repositories.MagicLinkTokenRepository;
import com.cabanedulys.api.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Lien magique à usage unique (feuille de route, phase 1).
 *
 * <ol>
 *   <li>Le client demande un lien pour une adresse normalisée.</li>
 *   <li>Le serveur crée un secret aléatoire (256 bits), n'en conserve que le hachage SHA-256
 *       et fixe une expiration courte.</li>
 *   <li>Le courriel contient un lien HTTPS vers le site : {@code /login/callback?token=…}.</li>
 *   <li>Le callback valide le jeton, l'invalide atomiquement et ouvre la session.</li>
 * </ol>
 *
 * <p>La demande répond toujours de la même façon, que l'adresse soit connue ou non, afin de ne
 * pas permettre l'énumération des comptes.</p>
 */
@Service
public class MagicLinkService {

    private static final Logger log = LoggerFactory.getLogger(MagicLinkService.class);

    private final MagicLinkTokenRepository tokens;
    private final UserRepository users;
    private final MailService mail;
    private final String baseUrl;
    private final Duration ttl;
    private final boolean enabled;

    private final SecureRandom random = new SecureRandom();
    private final Base64.Encoder b64url = Base64.getUrlEncoder().withoutPadding();

    public MagicLinkService(MagicLinkTokenRepository tokens,
                            UserRepository users,
                            MailService mail,
                            @Value("${app.base-url}") String baseUrl,
                            @Value("${app.auth.magic-link.ttl-minutes:15}") long ttlMinutes,
                            @Value("${app.features.magic-link-enabled:true}") boolean enabled) {
        this.tokens = tokens;
        this.users = users;
        this.mail = mail;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.ttl = Duration.ofMinutes(ttlMinutes);
        this.enabled = enabled;
    }

    public static String normalizeEmail(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
    }

    /** Crée le jeton et envoie le courriel. Ne révèle jamais si l'adresse est inscrite. */
    @Transactional
    public void request(String rawEmail) {
        if (!enabled) {
            throw new FeatureDisabledException("La connexion par lien magique est temporairement désactivée.");
        }
        String email = normalizeEmail(rawEmail);

        byte[] secret = new byte[32];
        random.nextBytes(secret);
        String token = b64url.encodeToString(secret);
        Instant now = Instant.now();

        tokens.save(MagicLinkToken.builder()
                .tokenHash(sha256Hex(token))
                .email(email)
                .expiresAt(now.plus(ttl))
                .createdAt(now)
                .build());

        String url = baseUrl + "/login/callback?token=" + token;
        mail.send(email, "Votre lien de connexion — La Cabane du Lys", body(url));
    }

    /** Valide et consomme le jeton ; crée le membre à sa première connexion. */
    @Transactional
    public User verify(String token) {
        if (token == null || token.isBlank() || token.length() > 128) {
            throw new InvalidMagicLinkException();
        }
        MagicLinkToken t = tokens.findByTokenHash(sha256Hex(token.trim()))
                .orElseThrow(InvalidMagicLinkException::new);
        Instant now = Instant.now();
        if (t.getUsedAt() != null || t.getExpiresAt().isBefore(now)) {
            throw new InvalidMagicLinkException();
        }
        if (tokens.markUsed(t.getId(), now) != 1) {
            throw new InvalidMagicLinkException();
        }
        return users.findByEmail(t.getEmail()).orElseGet(() -> users.save(
                User.builder().email(t.getEmail()).role(Role.MEMBER).build()));
    }

    /** Ménage quotidien : les jetons expirés depuis plus d'un jour ne servent plus à rien. */
    @Scheduled(cron = "0 15 4 * * *")
    @Transactional
    public void purgeExpired() {
        int removed = tokens.deleteExpiredBefore(Instant.now().minus(Duration.ofDays(1)));
        if (removed > 0) log.info("[MagicLink] {} jeton(s) expiré(s) supprimé(s).", removed);
    }

    private String body(String url) {
        return "Bonjour,\n\n"
                + "Voici votre lien de connexion à La Cabane du Lys :\n"
                + url + "\n\n"
                + "Il est valable " + ttl.toMinutes() + " minutes et ne peut être utilisé qu'une seule fois.\n"
                + "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce courriel.\n\n"
                + "— L'équipe de La Cabane du Lys\n";
    }

    static String sha256Hex(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }
}
