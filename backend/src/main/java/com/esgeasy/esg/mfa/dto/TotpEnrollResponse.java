package com.lestari.esg.mfa.dto;

public record TotpEnrollResponse(String secret, String qrCodeDataUri, String otpauthUri) {
}
