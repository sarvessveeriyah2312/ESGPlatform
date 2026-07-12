package com.lestari.esg.security;

import com.lestari.esg.common.exceptions.ForbiddenException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CurrentUserProvider {

    public LestariPrincipal getPrincipal() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof LestariPrincipal principal)) {
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
}
