package com.cabanedulys.api.services;

import com.cabanedulys.api.config.WebAuthnConfig;
import com.cabanedulys.api.dto.WebAuthnVerifyRequest;
import com.cabanedulys.api.models.User;
import com.cabanedulys.api.models.WebAuthnCredential;
import com.cabanedulys.api.repositories.UserRepository;
import com.cabanedulys.api.repositories.WebAuthnCredentialRepository;
import com.webauthn4j.WebAuthnManager;
import com.webauthn4j.authenticator.AuthenticatorImpl;
import com.webauthn4j.converter.util.ObjectConverter;
import com.webauthn4j.data.*;
import com.webauthn4j.data.attestation.authenticator.AttestedCredentialData;
import com.webauthn4j.data.attestation.authenticator.COSEKey;
import com.webauthn4j.data.client.Origin;
import com.webauthn4j.data.client.challenge.DefaultChallenge;
import com.webauthn4j.server.ServerProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.*;

/**
 * WebAuthn / Passkeys — méthode complémentaire au lien magique (feuille de route, phase 1).
 *
 * <ul>
 *   <li><b>Enregistrement</b> : réservé à une session déjà ouverte (adresse vérifiée par lien
 *       magique). Aucun compte n'est créé par ce chemin.</li>
 *   <li><b>Connexion</b> : sans adresse courriel. Le serveur émet un défi identifié par un
 *       {@code challengeId} aléatoire ; l'authentificateur choisi par l'utilisateur désigne
 *       lui-même le compte (credential discoverable).</li>
 * </ul>
 *
 * <p>Les défis vivent deux minutes dans Redis. Sans Redis, WebAuthn est indisponible et le
 * lien magique reste le chemin principal.</p>
 */
@Service
public class AuthService {

    private static final String CHALLENGE_KEY = "webauthn:challenge:";
    private static final Duration CHALLENGE_TTL = Duration.ofMinutes(2);

    private final UserRepository users;
    private final WebAuthnCredentialRepository credentials;
    private final WebAuthnConfig webAuthn;
    private final StringRedisTemplate redis;
    private final WebAuthnManager webAuthnManager;
    private final ObjectConverter objectConverter;

    private final SecureRandom random = new SecureRandom();
    private final Base64.Encoder b64url = Base64.getUrlEncoder().withoutPadding();
    private final Base64.Decoder b64urlDec = Base64.getUrlDecoder();

    public AuthService(UserRepository users, WebAuthnCredentialRepository credentials,
                       WebAuthnConfig webAuthn, StringRedisTemplate redis) {
        this.users = users;
        this.credentials = credentials;
        this.webAuthn = webAuthn;
        this.redis = redis;
        this.objectConverter = new ObjectConverter();
        this.webAuthnManager = WebAuthnManager.createNonStrictWebAuthnManager();
    }

    // ---------- WebAuthn : enregistrement (session requise) ----------

    public Map<String, Object> registrationOptions(String email) {
        User user = users.findByEmail(email).orElseThrow(
                () -> new IllegalStateException("Aucun compte pour cette session."));
        String challengeId = newId();
        String challenge = newChallenge(challengeId);

        Map<String, Object> opts = new LinkedHashMap<>();
        opts.put("challengeId", challengeId);
        opts.put("challenge", challenge);
        opts.put("rp", Map.of("id", webAuthn.getRpId(), "name", webAuthn.getRpName()));
        opts.put("user", Map.of(
                "id", b64url.encodeToString(user.getId().toString().getBytes()),
                "name", user.getEmail(),
                "displayName", user.getDisplayName() == null ? user.getEmail() : user.getDisplayName()));
        opts.put("pubKeyCredParams", List.of(
                Map.of("type", "public-key", "alg", -7),    // ES256
                Map.of("type", "public-key", "alg", -257))); // RS256
        opts.put("timeout", 120000);
        opts.put("attestation", "none");
        opts.put("authenticatorSelection", Map.of(
                "userVerification", "preferred",
                "residentKey", "preferred"));
        opts.put("excludeCredentials", credentials.findByUserEmail(email).stream()
                .map(c -> Map.of("type", "public-key", "id", c.getCredentialId())).toList());
        return opts;
    }

    @Transactional
    public User verifyRegistration(String email, WebAuthnVerifyRequest req) {
        String storedChallenge = popChallenge(req.challengeId());
        User user = users.findByEmail(email).orElseThrow(
                () -> new IllegalStateException("Aucun compte pour cette session."));

        byte[] clientDataJSON   = b64urlDec.decode(str(req.response(), "clientDataJSON"));
        byte[] attestationObj   = b64urlDec.decode(str(req.response(), "attestationObject"));

        RegistrationRequest request = new RegistrationRequest(attestationObj, clientDataJSON);

        Set<Origin> origins = Set.of(new Origin(webAuthn.getOrigin()));
        DefaultChallenge challenge = new DefaultChallenge(b64urlDec.decode(storedChallenge));
        ServerProperty serverProperty = new ServerProperty(origins, webAuthn.getRpId(), challenge, null);

        RegistrationParameters params = new RegistrationParameters(serverProperty, null, false, true);

        RegistrationData result = webAuthnManager.validate(request, params);

        AttestedCredentialData acd = result.getAttestationObject()
                .getAuthenticatorData()
                .getAttestedCredentialData();

        String credentialId = b64url.encodeToString(acd.getCredentialId());
        String publicKey    = b64url.encodeToString(
                objectConverter.getCborConverter().writeValueAsBytes(acd.getCOSEKey()));

        credentials.save(WebAuthnCredential.builder()
                .credentialId(credentialId)
                .publicKey(publicKey)
                .user(user)
                .build());

        return user;
    }

    // ---------- WebAuthn : connexion (sans courriel) ----------

    public Map<String, Object> loginOptions() {
        String challengeId = newId();
        String challenge = newChallenge(challengeId);

        Map<String, Object> opts = new LinkedHashMap<>();
        opts.put("challengeId", challengeId);
        opts.put("challenge", challenge);
        opts.put("rpId", webAuthn.getRpId());
        opts.put("allowCredentials", List.of());
        opts.put("userVerification", "preferred");
        opts.put("timeout", 120000);
        return opts;
    }

    @Transactional
    public User verifyLogin(WebAuthnVerifyRequest req) {
        String storedChallenge = popChallenge(req.challengeId());
        if (req.rawId() == null || req.rawId().isBlank()) {
            throw new IllegalArgumentException("Champ manquant : rawId");
        }

        WebAuthnCredential cred = credentials.findByCredentialId(req.rawId())
                .orElseThrow(() -> new IllegalStateException("Authentificateur inconnu."));

        byte[] clientDataJSON    = b64urlDec.decode(str(req.response(), "clientDataJSON"));
        byte[] authenticatorData = b64urlDec.decode(str(req.response(), "authenticatorData"));
        byte[] signature         = b64urlDec.decode(str(req.response(), "signature"));
        byte[] credentialId      = b64urlDec.decode(req.rawId());

        Object uh = req.response().get("userHandle");
        byte[] userHandle = (uh != null && !uh.toString().isEmpty()) ? b64urlDec.decode(uh.toString()) : null;

        AuthenticationRequest request = new AuthenticationRequest(
                credentialId, userHandle, authenticatorData, clientDataJSON, signature);

        Set<Origin> origins = Set.of(new Origin(webAuthn.getOrigin()));
        DefaultChallenge challenge = new DefaultChallenge(b64urlDec.decode(storedChallenge));
        ServerProperty serverProperty = new ServerProperty(origins, webAuthn.getRpId(), challenge, null);

        COSEKey coseKey = objectConverter.getCborConverter()
                .readValue(b64urlDec.decode(cred.getPublicKey()), COSEKey.class);
        AttestedCredentialData acd = new AttestedCredentialData(null, credentialId, coseKey);
        AuthenticatorImpl authenticator = new AuthenticatorImpl(acd, null, cred.getSignatureCount());

        AuthenticationParameters params = new AuthenticationParameters(serverProperty, authenticator, null, false, true);

        AuthenticationData result = webAuthnManager.validate(request, params);

        cred.setSignatureCount(result.getAuthenticatorData().getSignCount());
        return cred.getUser();
    }

    // ---------- utilitaires ----------

    private String newId() {
        byte[] buf = new byte[16];
        random.nextBytes(buf);
        return b64url.encodeToString(buf);
    }

    private String newChallenge(String challengeId) {
        byte[] buf = new byte[32];
        random.nextBytes(buf);
        String challenge = b64url.encodeToString(buf);
        try {
            redis.opsForValue().set(CHALLENGE_KEY + challengeId, challenge, CHALLENGE_TTL);
        } catch (Exception e) {
            throw new IllegalStateException("Service de passkeys momentanément indisponible.");
        }
        return challenge;
    }

    private String popChallenge(String challengeId) {
        if (challengeId == null || challengeId.isBlank()) {
            throw new IllegalArgumentException("Champ manquant : challengeId");
        }
        String key = CHALLENGE_KEY + challengeId;
        String challenge;
        try {
            challenge = redis.opsForValue().get(key);
            if (challenge != null) redis.delete(key);
        } catch (Exception e) {
            throw new IllegalStateException("Service de passkeys momentanément indisponible.");
        }
        if (challenge == null) throw new IllegalStateException("Défi expiré ou introuvable.");
        return challenge;
    }

    private static String str(Map<String, Object> map, String field) {
        if (map == null) throw new IllegalArgumentException("Réponse d'authentificateur manquante.");
        Object v = map.get(field);
        if (v == null) throw new IllegalArgumentException("Champ manquant : " + field);
        return v.toString();
    }
}
