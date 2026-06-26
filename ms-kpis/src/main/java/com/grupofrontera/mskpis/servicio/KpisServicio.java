package com.grupofrontera.mskpis.servicio;

import com.grupofrontera.mskpis.dto.ActualizarKpisRequest;
import com.grupofrontera.mskpis.dto.EventoActualizacionStock;
import com.grupofrontera.mskpis.dto.EventoVentaRealizada;
import com.grupofrontera.mskpis.dto.RespuestaKpis;
import com.grupofrontera.mskpis.entidad.IndicadorInventario;
import com.grupofrontera.mskpis.entidad.IndicadorVentas;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@ApplicationScoped
public class KpisServicio {

    private static final Logger LOG = Logger.getLogger(KpisServicio.class);
    private static final DateTimeFormatter FORMATO_PERIODO = DateTimeFormatter.ofPattern("yyyy-MM");

    @Transactional
    public void procesarVentaRealizada(EventoVentaRealizada evento) {
        String periodo = evento.fechaHora != null
                ? evento.fechaHora.format(FORMATO_PERIODO)
                : LocalDateTime.now().format(FORMATO_PERIODO);

        LOG.infof("Procesando VentaRealizada: ventaId=%d, sucursal=%d, monto=%s, periodo=%s",
                evento.ventaId, evento.sucursalRefId, evento.montoTotal, periodo);

        IndicadorVentas indicador = IndicadorVentas
                .buscarPorSucursalYPeriodo(evento.sucursalRefId, periodo)
                .orElseGet(() -> {
                    IndicadorVentas nuevo = new IndicadorVentas();
                    nuevo.sucursalRefId = evento.sucursalRefId;
                    nuevo.periodo = periodo;
                    nuevo.fechaCalculo = LocalDateTime.now();
                    return nuevo;
                });

        indicador.totalVentas = indicador.totalVentas.add(evento.montoTotal);
        indicador.cantidadTransacciones++;
        indicador.recalcularTicketPromedio();
        indicador.recalcularPorcentajeCumplimiento();
        indicador.fechaCalculo = LocalDateTime.now();

        indicador.persistAndFlush();
        LOG.infof("IndicadorVentas actualizado: sucursal=%d, periodo=%s, totalVentas=%s",
                indicador.sucursalRefId, indicador.periodo, indicador.totalVentas);
    }

    @Transactional
    public RespuestaKpis actualizar(ActualizarKpisRequest req) {
        if (req.sucursalId == null || req.periodo == null || req.periodo.isBlank()) {
            throw new jakarta.ws.rs.BadRequestException("sucursalId y periodo son obligatorios");
        }

        IndicadorVentas indicador = IndicadorVentas
                .buscarPorSucursalYPeriodo(req.sucursalId, req.periodo)
                .orElseGet(() -> {
                    IndicadorVentas nuevo = new IndicadorVentas();
                    nuevo.sucursalRefId = req.sucursalId;
                    nuevo.periodo = req.periodo;
                    nuevo.fechaCalculo = LocalDateTime.now();
                    return nuevo;
                });

        if (req.totalVentas != null) indicador.totalVentas = req.totalVentas;
        if (req.cantidadTransacciones != null) indicador.cantidadTransacciones = req.cantidadTransacciones;
        if (req.metaMensual != null) indicador.metaMensual = req.metaMensual;

        indicador.recalcularTicketPromedio();
        indicador.recalcularPorcentajeCumplimiento();
        indicador.fechaCalculo = LocalDateTime.now();
        indicador.persistAndFlush();

        LOG.infof("KPI actualizado manualmente: sucursal=%d, periodo=%s", req.sucursalId, req.periodo);

        IndicadorInventario inventario = IndicadorInventario
                .buscarPorSucursalYPeriodo(req.sucursalId, req.periodo).orElse(null);
        return RespuestaKpis.desde(indicador, inventario);
    }

    @Transactional
    public void procesarActualizacionStock(EventoActualizacionStock evento) {
        String periodo = LocalDateTime.now().format(FORMATO_PERIODO);

        LOG.infof("Procesando ActualizacionStock: productoId=%d, sucursal=%d, bajominimo=%b",
                evento.productoId, evento.sucursalId, evento.bajominimo);

        IndicadorInventario indicador = IndicadorInventario
                .buscarPorSucursalYPeriodo(evento.sucursalId, periodo)
                .orElseGet(() -> {
                    IndicadorInventario nuevo = new IndicadorInventario();
                    nuevo.sucursalRefId = evento.sucursalId;
                    nuevo.periodo = periodo;
                    nuevo.fechaCalculo = LocalDateTime.now();
                    return nuevo;
                });

        if (evento.bajominimo) {
            indicador.productosBajoMinimo++;
        }
        indicador.fechaCalculo = LocalDateTime.now();

        indicador.persistAndFlush();
        LOG.infof("IndicadorInventario actualizado: sucursal=%d, periodo=%s, productosBajoMinimo=%d",
                indicador.sucursalRefId, indicador.periodo, indicador.productosBajoMinimo);
    }
}
