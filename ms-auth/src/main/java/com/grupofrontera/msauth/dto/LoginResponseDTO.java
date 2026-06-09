package com.grupofrontera.msauth.dto;

import java.util.UUID;

public class LoginResponseDTO {

    public UUID usuarioId;
    public String email;
    public String accessToken;
    public String refreshToken;

    public LoginResponseDTO(UUID usuarioId, String email, String accessToken, String refreshToken) {
        this.usuarioId = usuarioId;
        this.email = email;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
