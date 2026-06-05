package com.grupofrontera.msauth.dto;

import jakarta.validation.constraints.NotBlank;

public class RefreshRequestDTO {

    @NotBlank
    public String refreshToken;
}
