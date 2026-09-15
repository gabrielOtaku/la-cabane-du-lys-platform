package com.cabanedulys.api.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.Arrays;

/**
 * Mode {@code app.mail.mode=log} (défaut) : le courriel est écrit dans les logs au lieu d'être
 * envoyé. Réservé au développement — le lien magique est un secret de connexion et ne doit
 * jamais apparaître dans les logs d'un environnement partagé.
 */
@Service
@ConditionalOnProperty(name = "app.mail.mode", havingValue = "log", matchIfMissing = true)
public class LogMailService implements MailService {

    private static final Logger log = LoggerFactory.getLogger(LogMailService.class);

    public LogMailService(Environment env) {
        boolean dev = Arrays.asList(env.getActiveProfiles()).contains("dev");
        if (!dev) {
            log.warn("MAIL_MODE=log actif hors profil dev : aucun courriel ne sera envoyé et les liens "
                    + "de connexion seront visibles dans les logs. Configurer MAIL_MODE=smtp en production.");
        }
    }

    @Override
    public void send(String to, String subject, String textBody) {
        log.warn("\n==================== COURRIEL (mode log, dev uniquement) ====================\n"
                + "À      : {}\nObjet  : {}\n\n{}\n"
                + "=============================================================================",
                to, subject, textBody);
    }
}
