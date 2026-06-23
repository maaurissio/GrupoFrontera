package com.grupofrontera.msauth.dto;

import jakarta.validation.constraints.NotNull;

public class EstadoRequestDTO {

    @NotNull(message = "El estado activo es obligatorio")
    public Boolean activo;
}
