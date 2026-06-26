package com.grupofrontera.mskpis.dto;

import java.math.BigDecimal;

public class ActualizarKpisRequest {
    public Long sucursalId;
    public String periodo;
    public BigDecimal totalVentas;
    public Integer cantidadTransacciones;
    public BigDecimal metaMensual;
}
