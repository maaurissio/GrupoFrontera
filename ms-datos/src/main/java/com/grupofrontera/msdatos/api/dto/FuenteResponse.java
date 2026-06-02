package com.grupofrontera.msdatos.api.dto;

import com.grupofrontera.msdatos.domain.entity.Fuente;
import java.time.LocalDateTime;

public class FuenteResponse {

    public Long id;
    public String codigo;
    public String nombre;
    public String descripcion;
    public Boolean activa;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static FuenteResponse fromEntity(Fuente fuente) {
        FuenteResponse r = new FuenteResponse();
        r.id = fuente.id;
        r.codigo = fuente.codigo;
        r.nombre = fuente.nombre;
        r.descripcion = fuente.descripcion;
        r.activa = fuente.activa;
        r.createdAt = fuente.createdAt;
        r.updatedAt = fuente.updatedAt;
        return r;
    }
}
