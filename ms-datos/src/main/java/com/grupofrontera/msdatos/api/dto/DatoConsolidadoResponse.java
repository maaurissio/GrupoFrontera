package com.grupofrontera.msdatos.api.dto;

import com.grupofrontera.msdatos.domain.entity.DatoConsolidado;
import com.grupofrontera.msdatos.domain.entity.EstadoDato;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DatoConsolidadoResponse {

    public Long id;
    public Long fuenteId;
    public String fuenteCodigo;
    public String fuenteNombre;
    public Long sucursalId;
    public String sucursalCodigo;
    public String sucursalNombre;
    public String tipoDato;
    public LocalDate periodo;
    public String valor;
    public EstadoDato estado;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static DatoConsolidadoResponse fromEntity(DatoConsolidado dato) {
        DatoConsolidadoResponse r = new DatoConsolidadoResponse();
        r.id = dato.id;
        r.fuenteId = dato.fuente.id;
        r.fuenteCodigo = dato.fuente.codigo;
        r.fuenteNombre = dato.fuente.nombre;
        r.sucursalId = dato.sucursal.id;
        r.sucursalCodigo = dato.sucursal.codigo;
        r.sucursalNombre = dato.sucursal.nombre;
        r.tipoDato = dato.tipoDato;
        r.periodo = dato.periodo;
        r.valor = dato.valor;
        r.estado = dato.estado;
        r.createdAt = dato.createdAt;
        r.updatedAt = dato.updatedAt;
        return r;
    }
}
