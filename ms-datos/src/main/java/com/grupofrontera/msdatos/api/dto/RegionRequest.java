package com.grupofrontera.msdatos.api.dto;

import jakarta.validation.constraints.NotBlank;

public class RegionRequest {

    @NotBlank(message = "El nombre de la region es obligatorio")
    public String nombre;
}
