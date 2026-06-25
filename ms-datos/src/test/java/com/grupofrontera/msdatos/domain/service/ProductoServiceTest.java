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
import java.util.Optional;

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
    void listarConFiltros_sinFiltros_retornaListaVacia() {
        List<Producto> resultado = productoService.listarConFiltros(null, null, null, null);
        assertTrue(resultado.isEmpty());
    }

    @Test
    void buscarPorId_inexistente_retornaVacio() {
        Optional<Producto> resultado = productoService.buscarPorId(999L);
        assertTrue(resultado.isEmpty());
    }

    @Test
    void existePorCodigoYSucursal_noExistente_retornaFalse() {
        boolean existe = productoService.existePorCodigoYSucursal("NO-EXISTE", 1L);
        assertFalse(existe);
    }

    @Test
    @Transactional
    void crear_sucursalNoEncontrada_lanza400() {
        ProductoRequest req = crearRequest(999L);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> productoService.crear(req));
        assertEquals(400, ex.getResponse().getStatus());
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
    void cambiarEstado_productoNoEncontrado_lanzaException() {
        assertThrows(IllegalArgumentException.class,
                () -> productoService.cambiarEstado(999L, false));
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
    void actualizar_productoNoEncontrado_lanzaException() {
        assertThrows(IllegalArgumentException.class,
                () -> productoService.actualizar(999L, crearRequest(1L)));
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
    void ajustarStock_productoNoEncontrado_lanzaException() {
        assertThrows(IllegalArgumentException.class,
                () -> productoService.ajustarStock(999L, 5));
    }

    @Test
    void importar_itemsNulos_retornaVacio() {
        var resultado = productoService.importar(null);
        assertEquals(0, resultado.total);
        assertEquals(0, resultado.insertados);
        assertTrue(resultado.rechazados.isEmpty());
    }

    @Test
    @Transactional
    void importar_sucursalNoEncontrada_rechazaItem() {
        ProductoRequest req = crearRequest(999L);

        var resultado = productoService.importar(List.of(req));

        assertEquals(1, resultado.total);
        assertEquals(0, resultado.insertados);
        assertEquals(1, resultado.rechazados.size());
    }

    @Test
    @Transactional
    void importar_insertaProductoValido() {
        Sucursal sucursal = crearSucursal();

        var resultado = productoService.importar(List.of(crearRequest(sucursal.id)));

        assertEquals(1, resultado.total);
        assertEquals(1, resultado.insertados);
    }

    @Test
    @Transactional
    void importar_codigoDuplicado_rechazaItem() {
        Sucursal sucursal = crearSucursal();
        ProductoRequest req = crearRequest(sucursal.id);
        productoService.importar(List.of(req));

        var resultado = productoService.importar(List.of(req));

        assertEquals(1, resultado.total);
        assertEquals(0, resultado.insertados);
        assertEquals(1, resultado.rechazados.size());
        assertTrue(resultado.rechazados.get(0).motivo.contains("Ya existe"));
    }

    @Test
    void listarConFiltros_conFiltroSucursal_retornaFiltrado() {
        List<Producto> resultado = productoService.listarConFiltros(1L, null, null, null);
        assertNotNull(resultado);
    }

    @Test
    @Transactional
    void importar_conStockDefault_asignaDefaultCuandoNulo() {
        Sucursal sucursal = crearSucursal();
        ProductoRequest reqSinStock = new ProductoRequest();
        reqSinStock.codigo = "PROD-NO-STOCK";
        reqSinStock.nombre = "Sin Stock";
        reqSinStock.sucursalId = sucursal.id;
        reqSinStock.categoria = CategoriaProducto.TV;
        reqSinStock.precio = new BigDecimal("10000");

        var resultado = productoService.importar(List.of(reqSinStock));

        assertEquals(1, resultado.insertados);
    }
}
