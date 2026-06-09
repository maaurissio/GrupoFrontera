package com.grupofrontera.msauth.dto;

import java.util.UUID;

public class ValidateResponseDTO {

    public boolean valido;
    public UUID usuarioId;
    public String email;

    public ValidateResponseDTO(boolean valido, UUID usuarioId, String email) {
        this.valido = valido;
        this.usuarioId = usuarioId;
        this.email = email;
    }
}
