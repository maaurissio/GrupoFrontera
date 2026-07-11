package com.grupofrontera.mskpis.dto;

import com.grupofrontera.mskpis.entidad.VentaItem;

import java.math.BigDecimal;

public class VentaItemDTO {

    public Long id;
    public Long productoRefId;
    public String codigoProducto;
    public String nombreProducto;
    public String categoria;
    public Integer cantidad;
    public BigDecimal precioUnitario;
    public BigDecimal subtotal;

    public static VentaItemDTO desde(VentaItem item) {
        VentaItemDTO dto = new VentaItemDTO();
        dto.id = item.id;
        dto.productoRefId = item.productoRefId;
        dto.codigoProducto = item.codigoProducto;
        dto.nombreProducto = item.nombreProducto;
        dto.categoria = item.categoria;
        dto.cantidad = item.cantidad;
        dto.precioUnitario = item.precioUnitario;
        dto.subtotal = item.subtotal;
        return dto;
    }
}
