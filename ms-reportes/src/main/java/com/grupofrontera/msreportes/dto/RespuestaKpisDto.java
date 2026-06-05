package com.grupofrontera.msreportes.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RespuestaKpisDto {

    public Long sucursalId;
    public String periodo;

    public BigDecimal totalVentas;
    public Integer cantidadTransacciones;
    public BigDecimal ticketPromedio;
    public BigDecimal metaMensual;
    public BigDecimal porcentajeCumplimiento;
    public LocalDateTime fechaCalculoVentas;

    public Integer productosBajoMinimo;
    public BigDecimal rotacionPromedio;
    public Integer diasSinReposicion;
    public LocalDateTime fechaCalculoInventario;
}
