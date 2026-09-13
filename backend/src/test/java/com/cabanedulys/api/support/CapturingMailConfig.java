package com.cabanedulys.api.support;

import com.cabanedulys.api.mail.MailService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Capture les courriels en mémoire pour lire le lien magique dans les tests. */
@TestConfiguration
public class CapturingMailConfig {

    public record Sent(String to, String subject, String body) {}

    public static class CapturingMailService implements MailService {
        private static final Pattern TOKEN = Pattern.compile("token=([A-Za-z0-9_-]+)");
        public final List<Sent> sent = new CopyOnWriteArrayList<>();

        @Override
        public void send(String to, String subject, String textBody) {
            sent.add(new Sent(to, subject, textBody));
        }

        public Sent last() {
            if (sent.isEmpty()) throw new AssertionError("Aucun courriel capturé.");
            return sent.get(sent.size() - 1);
        }

        public String lastToken() {
            Matcher m = TOKEN.matcher(last().body());
            if (!m.find()) throw new AssertionError("Aucun jeton dans le dernier courriel : " + last().body());
            return m.group(1);
        }

        public void clear() {
            sent.clear();
        }
    }

    @Bean
    @Primary
    public CapturingMailService capturingMailService() {
        return new CapturingMailService();
    }
}
