package com.grupofrontera.msauth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class RegisterRequestDTO {

    @NotNull
    public UUID usuarioId;

    @NotBlank
    @Email
    public String email;

    @NotBlank
    public String password;
}
