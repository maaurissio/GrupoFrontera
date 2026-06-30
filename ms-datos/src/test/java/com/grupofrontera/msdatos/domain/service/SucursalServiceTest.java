package com.grupofrontera.msdatos.domain.service;

import com.grupofrontera.msdatos.domain.entity.Sucursal;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class SucursalServiceTest {

    @Inject
    SucursalService sucursalService;

    private Sucursal sucursalValida() {
        Sucursal s = new Sucursal();
        s.codigo = "SUC-" + System.nanoTime();
        s.nombre = "Test";
        s.ciudad = "Santiago";
        s.habilitada = true;
        s.createdAt = LocalDateTime.now();
        s.updatedAt = LocalDateTime.now();
        return s;
    }

    @Test
    @Transactional
    void crear_sucursalValida_persisteYRetorna() {
        Sucursal s = sucursalValida();
        Sucursal resultado = sucursalService.crear(s);
        assertNotNull(resultado.id);
    }

    @Test
    @Transactional
    void actualizar_exitoso_actualizaCampos() {
        Sucursal s = sucursalValida();
        s.persistAndFlush();
        Long id = s.id;

        Sucursal datos = sucursalValida();
        datos.codigo = "SUC-MOD";
        datos.nombre = "Modificado";
        datos.ciudad = "Valparaiso";
        datos.latitud = -33.0;
        datos.longitud = -71.0;
        datos.direccion = "Calle 123";
        datos.anioApertura = 2020;

        Sucursal resultado = sucursalService.actualizar(id, datos);

        assertEquals("SUC-MOD", resultado.codigo);
        assertEquals("Modificado", resultado.nombre);
        assertEquals("Valparaiso", resultado.ciudad);
        assertEquals(-33.0, resultado.latitud);
        assertEquals(-71.0, resultado.longitud);
        assertEquals("Calle 123", resultado.direccion);
    }

    @Test
    @Transactional
    void cambiarEstado_exitoso_cambiaFlag() {
        Sucursal s = sucursalValida();
        s.persistAndFlush();
        Long id = s.id;

        Sucursal resultado = sucursalService.cambiarEstado(id, false);

        assertFalse(resultado.habilitada);
    }
}
