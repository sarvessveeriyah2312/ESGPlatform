package com.esgeasy.esg.governance.dto;

import com.esgeasy.esg.governance.MatterOwnership;
import com.esgeasy.esg.governance.OversightLevel;

public record MatterOwnershipResponse(
        String matterId,
        String matterName,
        String ownerName,
        OversightLevel oversightLevel,
        String notes
) {
    public static MatterOwnershipResponse from(MatterOwnership o) {
        return new MatterOwnershipResponse(o.getMatter().getId(), o.getMatter().getName(), o.getOwnerName(), o.getOversightLevel(), o.getNotes());
    }
}
