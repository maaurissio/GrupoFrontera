package com.grupofrontera.bff.dto;

import java.time.LocalDateTime;

public class SucursalDTO {

    public Long id;
    public String codigo;
    public String nombre;
    public String ciudad;
    public Long ciudadId;
    public Boolean habilitada;
    public Double latitud;
    public Double longitud;
    public String direccion;
    public Integer anioApertura;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
