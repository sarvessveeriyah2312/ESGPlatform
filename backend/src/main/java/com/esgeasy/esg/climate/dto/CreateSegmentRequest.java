package com.esgeasy.esg.climate.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSegmentRequest(@NotBlank String name) {
}
