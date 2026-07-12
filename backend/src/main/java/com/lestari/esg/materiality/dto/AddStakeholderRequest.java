package com.lestari.esg.materiality.dto;

import jakarta.validation.constraints.NotBlank;

public record AddStakeholderRequest(@NotBlank String name) {
}
