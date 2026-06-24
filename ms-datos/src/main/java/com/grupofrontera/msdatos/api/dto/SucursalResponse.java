package com.grupofrontera.msdatos.api.dto;

import com.grupofrontera.msdatos.domain.entity.Sucursal;
import java.time.LocalDateTime;

public class SucursalResponse {

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

    public static SucursalResponse fromEntity(Sucursal sucursal) {
        SucursalResponse r = new SucursalResponse();
        r.id = sucursal.id;
        r.codigo = sucursal.codigo;
        r.nombre = sucursal.nombre;
        r.ciudad = sucursal.ciudad;
        r.ciudadId = sucursal.ciudadId;
        r.habilitada = sucursal.habilitada;
        r.latitud = sucursal.latitud;
        r.longitud = sucursal.longitud;
        r.direccion = sucursal.direccion;
        r.anioApertura = sucursal.anioApertura;
        r.createdAt = sucursal.createdAt;
        r.updatedAt = sucursal.updatedAt;
        return r;
    }
}
