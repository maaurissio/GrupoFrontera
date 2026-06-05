package com.grupofrontera.mskpis.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class EventoVentaRealizada {

    public Long ventaId;
    public Long sucursalRefId;
    public BigDecimal montoTotal;
    public LocalDateTime fechaHora;
    public String canal;
}
