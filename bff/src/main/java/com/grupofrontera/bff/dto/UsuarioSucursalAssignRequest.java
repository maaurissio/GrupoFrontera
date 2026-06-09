package com.grupofrontera.bff.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class UsuarioSucursalAssignRequest {

    @NotBlank
    public UUID sucursalId;
}
