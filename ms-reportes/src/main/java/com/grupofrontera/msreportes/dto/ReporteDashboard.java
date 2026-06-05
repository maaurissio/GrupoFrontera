package com.grupofrontera.msreportes.dto;

import java.math.BigDecimal;

public class ReporteDashboard {

    public Long sucursalId;
    public String periodo;
    public BigDecimal totalVentas;
    public BigDecimal metaMensual;
    public BigDecimal porcentajeCumplimiento;
    public Integer productosBajoMinimo;
    public boolean disponibilidadSistema = true;
    public BigDecimal variacionPeriodoAnterior;
}
