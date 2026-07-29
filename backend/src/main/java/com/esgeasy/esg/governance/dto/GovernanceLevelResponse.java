package com.lestari.esg.governance.dto;

import com.lestari.esg.governance.GovernanceLevel;
import com.lestari.esg.governance.OversightLevel;

public record GovernanceLevelResponse(OversightLevel level, String roleTitle, String description) {
    public static GovernanceLevelResponse from(GovernanceLevel l) {
        return new GovernanceLevelResponse(l.getLevel(), l.getRoleTitle(), l.getDescription());
    }
}
