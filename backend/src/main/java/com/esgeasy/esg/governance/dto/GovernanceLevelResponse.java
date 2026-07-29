package com.esgeasy.esg.governance.dto;

import com.esgeasy.esg.governance.GovernanceLevel;
import com.esgeasy.esg.governance.OversightLevel;

public record GovernanceLevelResponse(OversightLevel level, String roleTitle, String description) {
    public static GovernanceLevelResponse from(GovernanceLevel l) {
        return new GovernanceLevelResponse(l.getLevel(), l.getRoleTitle(), l.getDescription());
    }
}
