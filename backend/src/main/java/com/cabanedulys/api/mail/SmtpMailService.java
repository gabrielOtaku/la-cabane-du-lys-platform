package com.cabanedulys.api.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/** Mode {@code app.mail.mode=smtp} : envoi réel via le serveur configuré dans {@code spring.mail.*}. */
@Service
@ConditionalOnProperty(name = "app.mail.mode", havingValue = "smtp")
public class SmtpMailService implements MailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpMailService.class);

    private final JavaMailSender sender;
    private final String from;

    public SmtpMailService(JavaMailSender sender, @Value("${app.mail.from}") String from) {
        this.sender = sender;
        this.from = from;
    }

    @Override
    public void send(String to, String subject, String textBody) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(textBody);
        try {
            sender.send(msg);
        } catch (MailException e) {
            // Jamais le contenu (il porte le lien de connexion) : seulement la cause technique.
            log.error("Échec d'envoi SMTP vers un destinataire : {}", e.getClass().getSimpleName());
            throw new MailDeliveryException("Le courriel n'a pas pu être envoyé.", e);
        }
    }
}
