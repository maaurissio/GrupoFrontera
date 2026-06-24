package com.grupofrontera.bff.dto;

import java.time.LocalDateTime;

public class ReporteGeneradoDTO {

    public Long id;
    public String tipo;
    public String formato;
    public String periodo;
    public Long sucursalId;
    public String sucursalNombre;
    public Boolean favorito;
    public LocalDateTime fechaGeneracion;
}
