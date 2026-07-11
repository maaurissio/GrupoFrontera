package com.grupofrontera.mskpis.dto;

import com.grupofrontera.mskpis.entidad.Venta;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class VentaDetalleDTO {

    public Long id;
    public Long sucursalRefId;
    public String periodo;
    public LocalDateTime fechaHora;
    public BigDecimal montoTotal;
    public String canal;
    public List<VentaItemDTO> items;

    public static VentaDetalleDTO desde(Venta venta, List<VentaItemDTO> items) {
        VentaDetalleDTO dto = new VentaDetalleDTO();
        dto.id = venta.id;
        dto.sucursalRefId = venta.sucursalRefId;
        dto.periodo = venta.periodo;
        dto.fechaHora = venta.fechaHora;
        dto.montoTotal = venta.montoTotal;
        dto.canal = venta.canal;
        dto.items = items;
        return dto;
    }
}
