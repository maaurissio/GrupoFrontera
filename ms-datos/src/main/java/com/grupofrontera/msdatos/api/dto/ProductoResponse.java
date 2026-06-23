package com.grupofrontera.msdatos.api.dto;

import com.grupofrontera.msdatos.domain.entity.Producto;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductoResponse {

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

    public static ProductoResponse fromEntity(Producto producto) {
        ProductoResponse r = new ProductoResponse();
        r.id = producto.id;
        r.codigo = producto.codigo;
        r.nombre = producto.nombre;
        r.sucursalId = producto.sucursal.id;
        r.sucursalCodigo = producto.sucursal.codigo;
        r.sucursalNombre = producto.sucursal.nombre;
        r.categoria = producto.categoria != null ? producto.categoria.name() : null;
        r.stock = producto.stock;
        r.stockMinimo = producto.stockMinimo;
        r.precio = producto.precio;
        r.descripcion = producto.descripcion;
        r.activo = producto.activo;
        r.fechaActualizacionStock = producto.fechaActualizacionStock;
        r.createdAt = producto.createdAt;
        r.updatedAt = producto.updatedAt;
        return r;
    }
}
