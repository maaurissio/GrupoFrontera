package com.grupofrontera.msdatos.domain.service;

import com.grupofrontera.msdatos.api.dto.ProductoRequest;
import com.grupofrontera.msdatos.domain.entity.CategoriaProducto;
import com.grupofrontera.msdatos.domain.entity.Producto;
import com.grupofrontera.msdatos.domain.entity.Sucursal;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class ProductoServiceTest {

    @Inject
    ProductoService productoService;

    private ProductoRequest crearRequest(Long sucursalId) {
        ProductoRequest r = new ProductoRequest();
        r.codigo = "PROD-" + System.nanoTime();
        r.nombre = "Producto Test";
        r.sucursalId = sucursalId;
        r.categoria = CategoriaProducto.ELECTRODOMESTICO;
        r.stock = 10;
        r.stockMinimo = 5;
        r.precio = new BigDecimal("50000");
        return r;
    }

    private Sucursal crearSucursal() {
        Sucursal s = new Sucursal();
        s.codigo = "SUC-" + System.nanoTime();
        s.nombre = "Sucursal Test";
        s.ciudad = "Santiago";
        s.persist();
        return s;
    }

    @Test
    @Transactional
    void crear_exitoso_persisteYRetorna() {
        Sucursal sucursal = crearSucursal();
        ProductoRequest req = crearRequest(sucursal.id);

        Producto resultado = productoService.crear(req);

        assertNotNull(resultado.id);
        assertTrue(resultado.activo);
    }

    @Test
    @Transactional
    void crear_codigoDuplicado_lanza409() {
        Sucursal sucursal = crearSucursal();
        ProductoRequest req = crearRequest(sucursal.id);
        productoService.crear(req);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> productoService.crear(req));
        assertEquals(409, ex.getResponse().getStatus());
    }

    @Test
    @Transactional
    void cambiarEstado_exitoso_cambiaActivo() {
        Sucursal sucursal = crearSucursal();
        Producto p = productoService.crear(crearRequest(sucursal.id));

        Producto resultado = productoService.cambiarEstado(p.id, false);

        assertFalse(resultado.activo);
    }

    @Test
    @Transactional
    void actualizar_exitoso_actualizaCampos() {
        Sucursal sucursal = crearSucursal();
        Producto p = productoService.crear(crearRequest(sucursal.id));

        ProductoRequest actualizacion = new ProductoRequest();
        actualizacion.codigo = "PROD-UPD";
        actualizacion.nombre = "Actualizado";
        actualizacion.sucursalId = sucursal.id;
        actualizacion.categoria = CategoriaProducto.TV;
        actualizacion.stock = 20;
        actualizacion.stockMinimo = 10;
        actualizacion.precio = new BigDecimal("99999");

        Producto resultado = productoService.actualizar(p.id, actualizacion);

        assertEquals("PROD-UPD", resultado.codigo);
        assertEquals("Actualizado", resultado.nombre);
        assertEquals(CategoriaProducto.TV, resultado.categoria);
        assertEquals(20, resultado.stock);
    }

    @Test
    @Transactional
    void ajustarStock_exitoso_modificaStock() {
        Sucursal sucursal = crearSucursal();
        Producto p = productoService.crear(crearRequest(sucursal.id));

        Producto resultado = productoService.ajustarStock(p.id, 5);

        assertEquals(15, resultado.stock);
    }

    @Test
    @Transactional
    void ajustarStock_deltaNegativoStockResultanteNegativo_lanza400() {
        Sucursal sucursal = crearSucursal();
        Producto p = productoService.crear(crearRequest(sucursal.id));

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> productoService.ajustarStock(p.id, -20));
        assertEquals(400, ex.getResponse().getStatus());
    }

    @Test
    @Transactional
    void importar_multiplesItems_insertaYRechazaMezclados() {
        Sucursal sucursal = crearSucursal();
        ProductoRequest valido = crearRequest(sucursal.id);
        ProductoRequest invalido = crearRequest(999L);

        var resultado = productoService.importar(List.of(valido, invalido));

        assertEquals(2, resultado.total);
        assertEquals(1, resultado.insertados);
        assertEquals(1, resultado.rechazados.size());
    }
}
