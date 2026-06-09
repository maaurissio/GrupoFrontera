package com.grupofrontera.msreportes.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class IndicadorInventarioDto {

    public Integer productosBajoMinimo;
    public BigDecimal rotacionPromedio;
    public Integer diasSinReposicion;
    public LocalDateTime fechaCalculoInventario;
}
