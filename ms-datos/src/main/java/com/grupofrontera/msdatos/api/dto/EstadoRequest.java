package com.grupofrontera.msdatos.api.dto;

import jakarta.validation.constraints.NotNull;

public class EstadoRequest {

    @NotNull(message = "El estado activo es obligatorio")
    public Boolean activo;
}
