package com.lestari.esg.email;

import com.lestari.esg.email.dto.TestEmailResponse;
import com.lestari.esg.security.SecretCryptoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Properties;
import java.util.UUID;

/**
 * Sends transactional email either via a tenant's own "bring your own SMTP" settings
 * ({@link CompanyEmailSettings}) or, if the tenant hasn't configured one, the platform-wide
 * default {@link JavaMailSender} (built from {@code spring.mail.*} / {@code SMTP_*} env vars).
 * If neither is configured, sending is silently skipped — callers (e.g. team invites) already
 * fall back to a shareable link.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender platformMailSender;
    private final String platformFromAddress;
    private final boolean platformConfigured;
    private final CompanyEmailSettingsRepository companyEmailSettingsRepository;
    private final SecretCryptoService cryptoService;

    public EmailService(JavaMailSender platformMailSender,
                         @Value("${lestari.mail.from}") String platformFromAddress,
                         @Value("${spring.mail.host:}") String platformMailHost,
                         CompanyEmailSettingsRepository companyEmailSettingsRepository,
                         SecretCryptoService cryptoService) {
        this.platformMailSender = platformMailSender;
        this.platformFromAddress = platformFromAddress;
        this.platformConfigured = platformMailHost != null && !platformMailHost.isBlank();
        this.companyEmailSettingsRepository = companyEmailSettingsRepository;
        this.cryptoService = cryptoService;
    }

    public void sendInviteEmail(UUID companyId, String toEmail, String toName, String companyName, String inviterName, Object role, String inviteUrl) {
        Sender sender = resolveSender(companyId);
        if (sender == null) {
            log.info("No SMTP configured for company {} or the platform — skipping invite email to {}; share the invite link manually.", companyId, toEmail);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(sender.fromAddress());
            message.setTo(toEmail);
            message.setSubject(inviterName + " invited you to join " + companyName + " on Lestari");
            message.setText(
                    "Hi " + toName + ",\n\n" +
                    inviterName + " has invited you to join " + companyName + " on Lestari as a " + role + ".\n\n" +
                    "Accept your invite here:\n" + inviteUrl + "\n\n" +
                    "This link expires in 7 days and can only be used once.\n\n" +
                    "— Lestari ESG Reporting Platform"
            );
            sender.mailSender().send(message);
        } catch (Exception e) {
            log.warn("Failed to send invite email to {}: {}", toEmail, e.getMessage());
        }
    }

    /** Sends a real test email using the given (not-yet-persisted-as-tested) settings, reporting success/failure back to the caller synchronously. */
    public TestEmailResponse sendTestEmail(CompanyEmailSettings settings, String toEmail) {
        JavaMailSenderImpl sender = buildSender(settings);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(settings.getFromAddress());
            message.setTo(toEmail);
            message.setSubject("Lestari SMTP test email");
            message.setText(
                    "This is a test email confirming your SMTP settings are working correctly.\n\n" +
                    "Host: " + settings.getSmtpHost() + ":" + settings.getSmtpPort() + "\n" +
                    "From: " + settings.getFromAddress() + "\n\n" +
                    "— Lestari ESG Reporting Platform"
            );
            sender.send(message);
            return new TestEmailResponse(true, "Test email sent successfully to " + toEmail + ".");
        } catch (Exception e) {
            return new TestEmailResponse(false, rootMessage(e));
        }
    }

    private record Sender(JavaMailSender mailSender, String fromAddress) {
    }

    private Sender resolveSender(UUID companyId) {
        Optional<CompanyEmailSettings> tenantSettings = companyEmailSettingsRepository.findByCompanyId(companyId)
                .filter(s -> Boolean.TRUE.equals(s.getEnabled()));
        if (tenantSettings.isPresent()) {
            CompanyEmailSettings s = tenantSettings.get();
            return new Sender(buildSender(s), s.getFromAddress());
        }
        if (platformConfigured) {
            return new Sender(platformMailSender, platformFromAddress);
        }
        return null;
    }

    private JavaMailSenderImpl buildSender(CompanyEmailSettings settings) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(settings.getSmtpHost());
        sender.setPort(settings.getSmtpPort());
        sender.setUsername(settings.getSmtpUsername());
        sender.setPassword(cryptoService.decrypt(settings.getSmtpPasswordEncrypted()));

        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.connectiontimeout", "8000");
        props.put("mail.smtp.timeout", "8000");
        props.put("mail.smtp.writetimeout", "8000");
        return sender;
    }

    private String rootMessage(Exception e) {
        Throwable root = e;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        return root.getMessage() != null ? root.getMessage() : e.getClass().getSimpleName();
    }
}
