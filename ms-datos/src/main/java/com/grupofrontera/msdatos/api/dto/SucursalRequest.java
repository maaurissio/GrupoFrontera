package com.grupofrontera.msdatos.api.dto;

import jakarta.validation.constraints.NotBlank;

public class SucursalRequest {

    @NotBlank(message = "El código es obligatorio")
    public String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    public String nombre;

    @NotBlank(message = "La ciudad es obligatoria")
    public String ciudad;

    // Referencia opcional a la ciudad del catalogo (ms-datos).
    public Long ciudadId;

    public Double latitud;

    public Double longitud;
}
