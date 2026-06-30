package com.grupofrontera.msreportes.servicio;

import com.grupofrontera.msreportes.cliente.ClienteDatos;
import com.grupofrontera.msreportes.cliente.ClienteKpis;
import com.grupofrontera.msreportes.dto.ProductoDto;
import com.grupofrontera.msreportes.dto.RespuestaKpisDto;
import com.grupofrontera.msreportes.dto.SucursalDto;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportesServicioTest {

    @Mock
    @RestClient
    ClienteKpis clienteKpis;

    @Mock
    @RestClient
    ClienteDatos clienteDatos;

    @InjectMocks
    ReportesServicio reportesServicio;

    private RespuestaKpisDto kpisDto;

    @BeforeEach
    void setUp() {
        kpisDto = new RespuestaKpisDto();
        kpisDto.sucursalId = 1L;
        kpisDto.periodo = "2026-06";
        kpisDto.totalVentas = new BigDecimal("500000");
        kpisDto.metaMensual = new BigDecimal("600000");
        kpisDto.porcentajeCumplimiento = new BigDecimal("83.33");
        kpisDto.cantidadTransacciones = 100;
        kpisDto.ticketPromedio = new BigDecimal("5000");
        kpisDto.productosBajoMinimo = 3;
        kpisDto.rotacionPromedio = BigDecimal.valueOf(2.5);
        kpisDto.diasSinReposicion = 5;
    }

    @Test
    void obtenerDashboard_exitoso_retornaDashboard() {
        when(clienteKpis.obtenerKpis(1L, "2026-06")).thenReturn(kpisDto);
        when(clienteKpis.obtenerKpis(1L, "2026-05"))
                .thenThrow(new WebApplicationException(Response.status(404).build()));

        var dashboard = reportesServicio.obtenerDashboard(1L, "2026-06");

        assertNotNull(dashboard);
        assertEquals(1L, dashboard.sucursalId);
        assertEquals("2026-06", dashboard.periodo);
        assertEquals(new BigDecimal("500000"), dashboard.totalVentas);
        assertEquals(BigDecimal.ZERO, dashboard.variacionPeriodoAnterior);
        assertTrue(dashboard.disponibilidadSistema);
    }

    @Test
    void obtenerDashboard_conVariacion_calculaPorcentaje() {
        RespuestaKpisDto anterior = new RespuestaKpisDto();
        anterior.totalVentas = new BigDecimal("400000");

        when(clienteKpis.obtenerKpis(1L, "2026-06")).thenReturn(kpisDto);
        when(clienteKpis.obtenerKpis(1L, "2026-05")).thenReturn(anterior);

        var dashboard = reportesServicio.obtenerDashboard(1L, "2026-06");

        assertEquals(new BigDecimal("25.00"), dashboard.variacionPeriodoAnterior);
    }

    @Test
    void obtenerComparativo_conDatos_retornaListaOrdenada() {
        RespuestaKpisDto dto2 = new RespuestaKpisDto();
        dto2.sucursalId = 2L;
        dto2.periodo = "2026-06";
        dto2.totalVentas = new BigDecimal("800000");
        dto2.metaMensual = new BigDecimal("700000");
        dto2.porcentajeCumplimiento = new BigDecimal("114.28");

        when(clienteKpis.obtenerComparativo("2026-06")).thenReturn(List.of(kpisDto, dto2));
        when(clienteKpis.obtenerKpis(anyLong(), eq("2026-05")))
                .thenThrow(new WebApplicationException(Response.status(404).build()));

        var comparativo = reportesServicio.obtenerComparativo("2026-06");

        assertEquals(2, comparativo.size());
        assertEquals(2L, comparativo.get(0).sucursalId);
        assertEquals(1L, comparativo.get(1).sucursalId);
    }

    @Test
    void obtenerInventario_conProductos_retornaListaEnriquecida() {
        ProductoDto p1 = new ProductoDto();
        p1.id = 1L;
        p1.codigo = "PROD-001";
        p1.sucursalId = 1L;

        SucursalDto s1 = new SucursalDto();
        s1.id = 1L;
        s1.nombre = "Sucursal Uno";

        when(clienteDatos.listarProductos(1L)).thenReturn(List.of(p1));
        when(clienteDatos.listarSucursales()).thenReturn(List.of(s1));

        var inventario = reportesServicio.obtenerInventario(1L);

        assertEquals(1, inventario.size());
        assertEquals("Sucursal Uno", inventario.get(0).sucursalNombre);
    }
}
