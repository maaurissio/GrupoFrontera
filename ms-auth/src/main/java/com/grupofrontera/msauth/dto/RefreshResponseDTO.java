package com.grupofrontera.msauth.dto;

public class RefreshResponseDTO {

    public String accessToken;
    public String refreshToken;

    public RefreshResponseDTO(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
