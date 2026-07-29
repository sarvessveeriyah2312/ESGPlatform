package com.esgeasy.esg.permission.dto;

import com.esgeasy.esg.permission.Permission;

public record PermissionResponse(
        String key,
        String module,
        String action,
        String label,
        String description
) {
    public static PermissionResponse from(Permission p) {
        return new PermissionResponse(p.getKey(), p.getModule(), p.getAction(), p.getLabel(), p.getDescription());
    }
}
