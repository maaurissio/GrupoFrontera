package com.grupofrontera.mskpis.dto;

import com.grupofrontera.mskpis.entidad.Venta;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class VentaResumenDTO {

    public Long id;
    public Long sucursalRefId;
    public String periodo;
    public LocalDateTime fechaHora;
    public BigDecimal montoTotal;
    public String canal;
    public Integer cantidadItems;

    public static VentaResumenDTO desde(Venta venta, long cantidadItems) {
        VentaResumenDTO dto = new VentaResumenDTO();
        dto.id = venta.id;
        dto.sucursalRefId = venta.sucursalRefId;
        dto.periodo = venta.periodo;
        dto.fechaHora = venta.fechaHora;
        dto.montoTotal = venta.montoTotal;
        dto.canal = venta.canal;
        dto.cantidadItems = (int) cantidadItems;
        return dto;
    }
}
