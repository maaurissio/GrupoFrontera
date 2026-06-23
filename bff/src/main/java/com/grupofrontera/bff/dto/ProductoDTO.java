package com.grupofrontera.bff.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductoDTO {

    public Long id;
    public String codigo;
    public String nombre;
    public Long sucursalId;
    public String sucursalCodigo;
    public String sucursalNombre;
    public String categoria;
    public Integer stock;
    public Integer stockMinimo;
    public BigDecimal precio;
    public String descripcion;
    public Boolean activo;
    public LocalDateTime fechaActualizacionStock;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
