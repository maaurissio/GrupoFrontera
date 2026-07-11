package com.grupofrontera.msreportes.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public class VentaDto {
    public Long id;
    public Long sucursalRefId;
    public String periodo;
    public LocalDateTime fechaHora;
    public BigDecimal montoTotal;
    public String canal;
}
