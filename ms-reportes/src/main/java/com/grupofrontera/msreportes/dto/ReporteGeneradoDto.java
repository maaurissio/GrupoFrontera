package com.grupofrontera.msreportes.dto;

import com.grupofrontera.msreportes.entidad.ReporteGenerado;
import java.time.LocalDateTime;

public class ReporteGeneradoDto {

    public Long id;
    public String tipo;
    public String formato;
    public String periodo;
    public Long sucursalId;
    public String sucursalNombre;
    public Boolean favorito;
    public LocalDateTime fechaGeneracion;

    public static ReporteGeneradoDto fromEntity(ReporteGenerado r) {
        ReporteGeneradoDto dto = new ReporteGeneradoDto();
        dto.id = r.id;
        dto.tipo = r.tipo;
        dto.formato = r.formato;
        dto.periodo = r.periodo;
        dto.sucursalId = r.sucursalId;
        dto.sucursalNombre = r.sucursalNombre;
        dto.favorito = r.favorito;
        dto.fechaGeneracion = r.fechaGeneracion;
        return dto;
    }
}
