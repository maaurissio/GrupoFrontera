package com.grupofrontera.msdatos.api.dto;

import com.grupofrontera.msdatos.domain.entity.Sucursal;
import java.time.LocalDateTime;

public class SucursalResponse {

    public Long id;
    public String codigo;
    public String nombre;
    public String ciudad;
    public Boolean habilitada;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static SucursalResponse fromEntity(Sucursal sucursal) {
        SucursalResponse r = new SucursalResponse();
        r.id = sucursal.id;
        r.codigo = sucursal.codigo;
        r.nombre = sucursal.nombre;
        r.ciudad = sucursal.ciudad;
        r.habilitada = sucursal.habilitada;
        r.createdAt = sucursal.createdAt;
        r.updatedAt = sucursal.updatedAt;
        return r;
    }
}
