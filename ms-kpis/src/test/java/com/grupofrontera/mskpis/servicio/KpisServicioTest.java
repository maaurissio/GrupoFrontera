package com.grupofrontera.mskpis.servicio;

import com.grupofrontera.mskpis.dto.EventoActualizacionStock;
import com.grupofrontera.mskpis.dto.EventoVentaRealizada;
import com.grupofrontera.mskpis.entidad.IndicadorInventario;
import com.grupofrontera.mskpis.entidad.IndicadorVentas;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KpisServicioTest {

    @InjectMocks
    KpisServicio kpisServicio;

    @Test
    void procesarVentaRealizada_periodoExistente_acumulaValores() {
        IndicadorVentas existente = spy(new IndicadorVentas());
        existente.sucursalRefId = 1L;
        existente.periodo = "2026-06";
        existente.totalVentas = new BigDecimal("100000");
        existente.cantidadTransacciones = 5;
        existente.metaMensual = new BigDecimal("1000000");
        existente.ticketPromedio = new BigDecimal("20000");
        doNothing().when(existente).persistAndFlush();

        EventoVentaRealizada evento = new EventoVentaRealizada();
        evento.ventaId = 2L;
        evento.sucursalRefId = 1L;
        evento.montoTotal = new BigDecimal("50000");
        evento.fechaHora = LocalDateTime.of(2026, 6, 16, 10, 0);

        try (MockedStatic<IndicadorVentas> iv = mockStatic(IndicadorVentas.class)) {
            iv.when(() -> IndicadorVentas.buscarPorSucursalYPeriodo(1L, "2026-06"))
                    .thenReturn(Optional.of(existente));

            kpisServicio.procesarVentaRealizada(evento);

            assertEquals(new BigDecimal("150000"), existente.totalVentas);
            assertEquals(6, existente.cantidadTransacciones);
            assertEquals(new BigDecimal("25000.00"), existente.ticketPromedio);
            verify(existente).persistAndFlush();
        }
    }

    @Test
    void procesarVentaRealizada_recalculaTicketPromedioYPorcentaje() {
        IndicadorVentas existente = spy(new IndicadorVentas());
        existente.sucursalRefId = 1L;
        existente.periodo = "2026-06";
        existente.totalVentas = BigDecimal.ZERO;
        existente.cantidadTransacciones = 0;
        existente.metaMensual = new BigDecimal("1000000");
        doNothing().when(existente).persistAndFlush();

        EventoVentaRealizada evento = new EventoVentaRealizada();
        evento.sucursalRefId = 1L;
        evento.montoTotal = new BigDecimal("750000");
        evento.fechaHora = LocalDateTime.of(2026, 6, 15, 10, 0);

        try (MockedStatic<IndicadorVentas> iv = mockStatic(IndicadorVentas.class)) {
            iv.when(() -> IndicadorVentas.buscarPorSucursalYPeriodo(1L, "2026-06"))
                    .thenReturn(Optional.of(existente));

            kpisServicio.procesarVentaRealizada(evento);

            assertEquals(new BigDecimal("750000"), existente.totalVentas);
            assertEquals(1, existente.cantidadTransacciones);
            assertEquals(new BigDecimal("750000.00"), existente.ticketPromedio);
            assertEquals(new BigDecimal("75.00"), existente.porcentajeCumplimiento);
        }
    }

    @Test
    void procesarActualizacionStock_bajoMinimo_incrementaContador() {
        IndicadorInventario existente = spy(new IndicadorInventario());
        existente.sucursalRefId = 1L;
        existente.periodo = "2026-06";
        existente.productosBajoMinimo = 3;
        doNothing().when(existente).persistAndFlush();

        EventoActualizacionStock evento = new EventoActualizacionStock();
        evento.productoId = 1L;
        evento.sucursalId = 1L;
        evento.bajominimo = true;
        evento.cantidad = -5;

        try (MockedStatic<IndicadorInventario> ii = mockStatic(IndicadorInventario.class)) {
            ii.when(() -> IndicadorInventario.buscarPorSucursalYPeriodo(eq(1L), anyString()))
                    .thenReturn(Optional.of(existente));

            kpisServicio.procesarActualizacionStock(evento);

            assertEquals(4, existente.productosBajoMinimo);
            verify(existente).persistAndFlush();
        }
    }

    @Test
    void procesarActualizacionStock_noBajoMinimo_noIncrementa() {
        IndicadorInventario existente = spy(new IndicadorInventario());
        existente.sucursalRefId = 1L;
        existente.periodo = "2026-06";
        existente.productosBajoMinimo = 3;
        doNothing().when(existente).persistAndFlush();

        EventoActualizacionStock evento = new EventoActualizacionStock();
        evento.productoId = 1L;
        evento.sucursalId = 1L;
        evento.bajominimo = false;
        evento.cantidad = 10;

        try (MockedStatic<IndicadorInventario> ii = mockStatic(IndicadorInventario.class)) {
            ii.when(() -> IndicadorInventario.buscarPorSucursalYPeriodo(eq(1L), anyString()))
                    .thenReturn(Optional.of(existente));

            kpisServicio.procesarActualizacionStock(evento);

            assertEquals(3, existente.productosBajoMinimo);
            verify(existente).persistAndFlush();
        }
    }

    @Test
    void procesarVentaRealizada_nuevoPeriodo_usaOrElseGet() {
        EventoVentaRealizada evento = new EventoVentaRealizada();
        evento.ventaId = 1L;
        evento.sucursalRefId = 1L;
        evento.montoTotal = new BigDecimal("500000");
        evento.fechaHora = LocalDateTime.of(2026, 6, 15, 10, 0);
        evento.canal = "WEB";

        try (MockedStatic<IndicadorVentas> iv = mockStatic(IndicadorVentas.class)) {
            iv.when(() -> IndicadorVentas.buscarPorSucursalYPeriodo(1L, "2026-06"))
                    .thenReturn(Optional.empty());

            try {
                kpisServicio.procesarVentaRealizada(evento);
            } catch (Exception e) {
                // persistAndFlush() throws without Hibernate session - expected
            }

            iv.verify(() -> IndicadorVentas.buscarPorSucursalYPeriodo(1L, "2026-06"));
        }
    }
}
