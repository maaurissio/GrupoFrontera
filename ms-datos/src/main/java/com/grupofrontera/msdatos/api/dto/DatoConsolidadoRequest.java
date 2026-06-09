package com.grupofrontera.msdatos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class DatoConsolidadoRequest {

    @NotNull(message = "El ID de fuente es obligatorio")
    public Long fuenteId;

    @NotNull(message = "El ID de sucursal es obligatorio")
    public Long sucursalId;

    @NotBlank(message = "El tipo de dato es obligatorio")
    public String tipoDato;

    @NotNull(message = "El periodo es obligatorio")
    public LocalDate periodo;

    public String valor;
}
