package com.grupofrontera.bff.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.UUID;

public class UsuarioCreateRequest {

    @NotBlank
    public String rut;
    public String dv;

    @NotBlank
    public String nombre;

    @NotBlank
    public String apellido;

    @NotBlank
    public String email;
    public String telefono;
    public LocalDate fechaNacimiento;

    @NotBlank
    public String password;
}
