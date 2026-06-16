package com.grupofrontera.msdatos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CiudadRequest {

    @NotBlank(message = "El nombre de la ciudad es obligatorio")
    public String nombre;

    @NotNull(message = "La region es obligatoria")
    public Long regionId;
}
