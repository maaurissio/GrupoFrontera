package com.grupofrontera.msdatos.api.dto;

import jakarta.validation.constraints.NotBlank;

public class FuenteRequest {

    @NotBlank(message = "El código es obligatorio")
    public String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    public String nombre;

    public String descripcion;
}
