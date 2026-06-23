package com.grupofrontera.msreportes.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductoDto {
    public Long id;
    public String codigo;
    public String nombre;
    public Long sucursalId;
    public String sucursalNombre;
    public String categoria;
    public Integer stock;
    public Integer stockMinimo;
    public BigDecimal precio;
    public LocalDateTime fechaActualizacionStock;
}
