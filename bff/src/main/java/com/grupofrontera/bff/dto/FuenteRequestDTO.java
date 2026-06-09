package com.grupofrontera.bff.dto;

import jakarta.validation.constraints.NotBlank;

public class FuenteRequestDTO {

    @NotBlank
    public String codigo;

    @NotBlank
    public String nombre;

    public String descripcion;
}
