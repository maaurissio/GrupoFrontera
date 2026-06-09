package com.grupofrontera.bff.dto;

import jakarta.validation.constraints.NotBlank;

public class RefreshRequest {

    @NotBlank
    public String refreshToken;
}
