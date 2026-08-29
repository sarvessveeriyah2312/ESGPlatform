package com.esgeasy.esg.security;

import com.esgeasy.esg.common.exceptions.ForbiddenException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CurrentUserProvider {

    public EsgEasyPrincipal getPrincipal() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof EsgEasyPrincipal principal)) {
            throw new ForbiddenException("No authenticated user in context");
        }
        return principal;
    }

    public UUID requireCompanyId() {
        UUID companyId = getPrincipal().companyId();
        if (companyId == null) {
            throw new ForbiddenException("Current user is not associated with a company");
        }
        return companyId;
    }

    public UUID requirePartnerId() {
        UUID partnerId = getPrincipal().partnerId();
        if (partnerId == null) {
            throw new ForbiddenException("Current user is not associated with a partner");
        }
        return partnerId;
    }
}
