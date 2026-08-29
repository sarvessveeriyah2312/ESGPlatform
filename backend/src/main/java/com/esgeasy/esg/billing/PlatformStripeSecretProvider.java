package com.esgeasy.esg.billing;

import com.esgeasy.esg.common.exceptions.ConflictException;
import com.esgeasy.esg.platform.PlatformSettings;
import com.esgeasy.esg.platform.PlatformSettingsRepository;
import com.esgeasy.esg.security.SecretCryptoService;
import org.springframework.stereotype.Service;

/**
 * Extracted from {@link CompanyBillingService}'s original private method — reused by
 * {@code PartnerService}'s Stripe Connect operations (WHITELABEL_PLAN.md Phase 5), which need the
 * same platform-level Stripe secret key, not a separate one.
 */
@Service
public class PlatformStripeSecretProvider {

    private final PlatformSettingsRepository platformSettingsRepository;
    private final SecretCryptoService cryptoService;

    public PlatformStripeSecretProvider(PlatformSettingsRepository platformSettingsRepository, SecretCryptoService cryptoService) {
        this.platformSettingsRepository = platformSettingsRepository;
        this.cryptoService = cryptoService;
    }

    public String requireSecretKey() {
        PlatformSettings settings = platformSettingsRepository.findFirstByOrderByCreatedAtAsc()
                .orElseThrow(() -> new ConflictException("Stripe isn't configured yet — ask a platform admin to set it up in Platform Settings"));
        if (!Boolean.TRUE.equals(settings.getStripeEnabled()) || settings.getStripeSecretKeyEncrypted() == null) {
            throw new ConflictException("Stripe payments aren't enabled yet — ask a platform admin to enable them in Platform Settings");
        }
        return cryptoService.decrypt(settings.getStripeSecretKeyEncrypted());
    }
}
