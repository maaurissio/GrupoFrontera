package com.grupofrontera.msreportes.servicio;

import com.grupofrontera.msreportes.entidad.ReporteGenerado;
import com.grupofrontera.msreportes.repositorio.ReporteGeneradoRepository;
import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReporteGeneradoServiceTest {

    @Mock
    ReporteGeneradoRepository repository;

    @InjectMocks
    ReporteGeneradoService service;

    private ReporteGenerado reporte;

    @BeforeEach
    void setUp() {
        reporte = new ReporteGenerado();
        reporte.id = 1L;
        reporte.tipo = "KPIS";
        reporte.formato = "PDF";
        reporte.periodo = "2026-06";
        reporte.sucursalId = 1L;
        reporte.sucursalNombre = "Sucursal Test";
        reporte.favorito = false;
    }

    @Test
    void registrar_persisteReporte() {
        service.registrar("KPIS", "pdf", "2026-06", 1L, "Sucursal Test");

        ArgumentCaptor<ReporteGenerado> captor = ArgumentCaptor.forClass(ReporteGenerado.class);
        verify(repository).persist(captor.capture());
        ReporteGenerado persisted = captor.getValue();

        assertEquals("KPIS", persisted.tipo);
        assertEquals("PDF", persisted.formato);
        assertEquals("2026-06", persisted.periodo);
        assertEquals(1L, persisted.sucursalId);
        assertEquals("Sucursal Test", persisted.sucursalNombre);
        assertFalse(persisted.favorito);
        assertNotNull(persisted.fechaGeneracion);
    }

    @Test
    void registrar_conFormatoMinuscula_loConvierteAMayuscula() {
        service.registrar("INVENTARIO", "xlsx", null, null, null);

        ArgumentCaptor<ReporteGenerado> captor = ArgumentCaptor.forClass(ReporteGenerado.class);
        verify(repository).persist(captor.capture());

        assertEquals("XLSX", captor.getValue().formato);
    }

    @Test
    void registrar_sinSucursal_representaConsolidado() {
        service.registrar("KPIS", "pdf", "2026-06", null, null);

        ArgumentCaptor<ReporteGenerado> captor = ArgumentCaptor.forClass(ReporteGenerado.class);
        verify(repository).persist(captor.capture());

        assertNull(captor.getValue().sucursalId);
        assertNull(captor.getValue().sucursalNombre);
    }

    @Test
    void listar_delegaARepository() {
        when(repository.listarTodos()).thenReturn(List.of(reporte));

        var resultado = service.listar();

        assertEquals(1, resultado.size());
        assertEquals("KPIS", resultado.get(0).tipo);
        verify(repository).listarTodos();
    }

    @Test
    void listar_sinDatos_retornaListaVacia() {
        when(repository.listarTodos()).thenReturn(List.of());

        var resultado = service.listar();

        assertTrue(resultado.isEmpty());
    }

    @Test
    void eliminar_existente_borraYNoLanza() {
        when(repository.deleteById(1L)).thenReturn(true);

        assertDoesNotThrow(() -> service.eliminar(1L));
        verify(repository).deleteById(1L);
    }

    @Test
    void eliminar_inexistente_lanza404() {
        when(repository.deleteById(99L)).thenReturn(false);

        assertThrows(NotFoundException.class, () -> service.eliminar(99L));
    }

    @Test
    void marcarFavorito_existente_actualizaYRetorna() {
        when(repository.findById(1L)).thenReturn(reporte);

        ReporteGenerado resultado = service.marcarFavorito(1L, true);

        assertTrue(resultado.favorito);
    }

    @Test
    void marcarFavorito_inexistente_lanza404() {
        when(repository.findById(99L)).thenReturn(null);

        assertThrows(NotFoundException.class, () -> service.marcarFavorito(99L, true));
    }

    @Test
    void marcarFavorito_desmarcar_cambiaAFalse() {
        reporte.favorito = true;
        when(repository.findById(1L)).thenReturn(reporte);

        ReporteGenerado resultado = service.marcarFavorito(1L, false);

        assertFalse(resultado.favorito);
    }
}
