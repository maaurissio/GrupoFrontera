package com.grupofrontera.bff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class DatoConsolidadoRequestDTO {

    @NotNull
    public Long fuenteId;

    @NotNull
    public Long sucursalId;

    @NotBlank
    public String tipoDato;

    @NotNull
    public LocalDate periodo;

    public String valor;
}
