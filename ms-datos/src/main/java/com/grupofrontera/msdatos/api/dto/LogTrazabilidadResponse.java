package com.grupofrontera.msdatos.api.dto;

import com.grupofrontera.msdatos.domain.entity.LogTrazabilidad;
import java.time.LocalDateTime;

public class LogTrazabilidadResponse {

    public Long id;
    public String accion;
    public String detalle;
    public LocalDateTime createdAt;

    public static LogTrazabilidadResponse fromEntity(LogTrazabilidad log) {
        LogTrazabilidadResponse r = new LogTrazabilidadResponse();
        r.id = log.id;
        r.accion = log.accion;
        r.detalle = log.detalle;
        r.createdAt = log.createdAt;
        return r;
    }
}
