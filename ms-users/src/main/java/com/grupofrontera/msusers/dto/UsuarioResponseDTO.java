package com.grupofrontera.msusers.dto;

import com.grupofrontera.msusers.enums.EstadoUsuario;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class UsuarioResponseDTO {
    public UUID id;
    public String rut;
    public String dv;
    public String nombre;
    public String apellido;
    public String email;
    public String telefono;
    public LocalDate fechaNacimiento;
    public EstadoUsuario estado;
    public List<String> roles;
    // Ids de las sucursales (en ms-datos) asignadas. El BFF resuelve los nombres.
    public List<Long> sucursalRefIds;
}
