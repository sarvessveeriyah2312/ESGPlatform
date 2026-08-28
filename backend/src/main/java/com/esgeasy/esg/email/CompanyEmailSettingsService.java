package com.esgeasy.esg.email;

import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.email.dto.EmailSettingsResponse;
import com.esgeasy.esg.email.dto.TestEmailResponse;
import com.esgeasy.esg.email.dto.UpdateEmailSettingsRequest;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.security.SecretCryptoService;
import com.esgeasy.esg.user.AppUser;
import com.esgeasy.esg.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class CompanyEmailSettingsService {

    private final CompanyEmailSettingsRepository repository;
    private final CurrentUserProvider currentUserProvider;
    private final AppUserRepository appUserRepository;
    private final SecretCryptoService cryptoService;
    private final EmailService emailService;
    private final SmtpHostValidator smtpHostValidator;

    public CompanyEmailSettingsService(CompanyEmailSettingsRepository repository,
                                        CurrentUserProvider currentUserProvider,
                                        AppUserRepository appUserRepository,
                                        SecretCryptoService cryptoService,
                                        EmailService emailService,
                                        SmtpHostValidator smtpHostValidator) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
        this.appUserRepository = appUserRepository;
        this.cryptoService = cryptoService;
        this.emailService = emailService;
        this.smtpHostValidator = smtpHostValidator;
    }

    @Transactional(readOnly = true)
    public EmailSettingsResponse get() {
        UUID companyId = currentUserProvider.requireCompanyId();
        return repository.findByCompanyId(companyId)
                .map(EmailSettingsResponse::from)
                .orElseGet(EmailSettingsResponse::notConfigured);
    }

    @Transactional
    public EmailSettingsResponse update(UpdateEmailSettingsRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        CompanyEmailSettings settings = repository.findByCompanyId(companyId).orElseGet(() -> {
            CompanyEmailSettings s = new CompanyEmailSettings();
            s.setCompanyId(companyId);
            return s;
        });

        if (request.password() != null && !request.password().isBlank()) {
            settings.setSmtpPasswordEncrypted(cryptoService.encrypt(request.password()));
        } else if (settings.getSmtpPasswordEncrypted() == null) {
            throw new IllegalArgumentException("Password is required when configuring SMTP for the first time");
        }

        smtpHostValidator.assertPubliclyRoutable(request.smtpHost());
        settings.setSmtpHost(request.smtpHost());
        settings.setSmtpPort(request.smtpPort());
        settings.setSmtpUsername(request.smtpUsername());
        settings.setFromAddress(request.fromAddress());
        settings.setEnabled(request.enabled());
        settings = repository.save(settings);

        return EmailSettingsResponse.from(settings);
    }

    @Transactional
    public TestEmailResponse sendTest() {
        UUID companyId = currentUserProvider.requireCompanyId();
        CompanyEmailSettings settings = repository.findByCompanyId(companyId)
                .orElseThrow(() -> new NotFoundException("No SMTP settings configured yet — save settings first"));
        AppUser user = appUserRepository.findById(currentUserProvider.getPrincipal().userId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        TestEmailResponse result = emailService.sendTestEmail(settings, user.getEmail());

        settings.setLastTestAt(Instant.now());
        settings.setLastTestSuccess(result.success());
        settings.setLastTestMessage(result.message());
        repository.save(settings);

        return result;
    }
}
