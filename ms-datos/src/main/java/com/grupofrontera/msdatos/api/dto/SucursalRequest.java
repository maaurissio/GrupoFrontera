package com.grupofrontera.msdatos.api.dto;

import jakarta.validation.constraints.NotBlank;

public class SucursalRequest {

    @NotBlank(message = "El código es obligatorio")
    public String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    public String nombre;

    @NotBlank(message = "La ciudad es obligatoria")
    public String ciudad;

    public Double latitud;

    public Double longitud;
}
