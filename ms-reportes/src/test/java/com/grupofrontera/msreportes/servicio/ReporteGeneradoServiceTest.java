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

import static org.junit.jupiter.api.Assertions.*;
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
}
