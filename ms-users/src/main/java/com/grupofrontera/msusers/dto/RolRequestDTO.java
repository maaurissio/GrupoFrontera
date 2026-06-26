package com.grupofrontera.msusers.dto;

import com.grupofrontera.msusers.enums.NombreRol;

import java.util.Map;

public class RolRequestDTO {
    public NombreRol nombre;
    public String descripcion;
    public Map<String, String> permisos;
}
