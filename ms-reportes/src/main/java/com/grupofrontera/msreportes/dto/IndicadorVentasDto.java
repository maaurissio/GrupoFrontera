package com.grupofrontera.msreportes.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class IndicadorVentasDto {

    public BigDecimal totalVentas;
    public Integer cantidadTransacciones;
    public BigDecimal ticketPromedio;
    public BigDecimal metaMensual;
    public BigDecimal porcentajeCumplimiento;
    public LocalDateTime fechaCalculoVentas;
}
