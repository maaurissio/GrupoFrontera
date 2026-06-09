package com.grupofrontera.bff.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DatoConsolidadoDTO {

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
    public String estado;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
