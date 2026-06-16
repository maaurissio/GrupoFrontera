package com.grupofrontera.bff.dto;

import jakarta.validation.constraints.NotBlank;

public class SucursalRequestDTO {

    @NotBlank
    public String codigo;

    @NotBlank
    public String nombre;

    @NotBlank
    public String ciudad;

    public Long ciudadId;

    public Double latitud;

    public Double longitud;
}
