package com.grupofrontera.msdatos.domain.service;

import com.grupofrontera.msdatos.api.dto.ImportResultadoResponse;
import com.grupofrontera.msdatos.api.dto.ProductoRequest;
import com.grupofrontera.msdatos.domain.entity.CategoriaProducto;
import com.grupofrontera.msdatos.domain.entity.Producto;
import com.grupofrontera.msdatos.domain.entity.Sucursal;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@ApplicationScoped
public class ProductoService {

    @Inject
    SucursalService sucursalService;

    public List<Producto> listarConFiltros(Long sucursalId, String categoria, String q, Boolean soloActivos) {
        var params = new java.util.HashMap<String, Object>();

        StringBuilder query = new StringBuilder("1 = 1");

        if (sucursalId != null) {
            query.append(" AND sucursal.id = :sucursalId");
            params.put("sucursalId", sucursalId);
        }
        if (categoria != null && !categoria.isBlank()) {
            query.append(" AND categoria = :categoria");
            params.put("categoria", CategoriaProducto.valueOf(categoria.toUpperCase()));
        }
        if (q != null && !q.isBlank()) {
            query.append(" AND (lower(codigo) LIKE :q OR lower(nombre) LIKE :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }
        if (soloActivos != null) {
            query.append(" AND activo = :activo");
            params.put("activo", soloActivos);
        }

        return Producto.find(query.toString(), params).list();
    }

    public Optional<Producto> buscarPorId(Long id) {
        return Producto.findByIdOptional(id);
    }

    public boolean existePorCodigoYSucursal(String codigo, Long sucursalId) {
        return Producto.count("codigo = ?1 and sucursal.id = ?2", codigo, sucursalId) > 0;
    }

    @Transactional
    public Producto crear(ProductoRequest request) {
        Sucursal sucursal = sucursalService.buscarPorId(request.sucursalId)
                .orElseThrow(() -> new WebApplicationException(
                        "Sucursal no encontrada: " + request.sucursalId, Response.Status.BAD_REQUEST));

        if (existePorCodigoYSucursal(request.codigo, request.sucursalId)) {
            throw new WebApplicationException(
                    "Ya existe un producto con el código '" + request.codigo
                            + "' en la sucursal " + request.sucursalId, Response.Status.CONFLICT);
        }

        Producto producto = new Producto();
        producto.codigo = request.codigo;
        producto.nombre = request.nombre;
        producto.sucursal = sucursal;
        producto.categoria = request.categoria;
        producto.stock = request.stock;
        producto.stockMinimo = request.stockMinimo;
        producto.precio = request.precio;
        producto.descripcion = request.descripcion;
        producto.activo = true;
        producto.fechaActualizacionStock = LocalDateTime.now();
        producto.persist();

        return producto;
    }

    @Transactional
    public Producto actualizar(Long id, ProductoRequest request) {
        Producto producto = Producto.findById(id);
        if (producto == null) {
            throw new IllegalArgumentException("Producto no encontrado con id: " + id);
        }

        Sucursal sucursal = sucursalService.buscarPorId(request.sucursalId)
                .orElseThrow(() -> new WebApplicationException(
                        "Sucursal no encontrada: " + request.sucursalId, Response.Status.BAD_REQUEST));

        boolean cambiaCodigoOSucursal =
                !Objects.equals(producto.codigo, request.codigo)
                        || !Objects.equals(producto.sucursal.id, request.sucursalId);
        if (cambiaCodigoOSucursal && existePorCodigoYSucursal(request.codigo, request.sucursalId)) {
            throw new WebApplicationException(
                    "Ya existe un producto con el código '" + request.codigo
                            + "' en la sucursal " + request.sucursalId, Response.Status.CONFLICT);
        }

        if (!Objects.equals(producto.stock, request.stock)) {
            producto.fechaActualizacionStock = LocalDateTime.now();
        }

        producto.codigo = request.codigo;
        producto.nombre = request.nombre;
        producto.sucursal = sucursal;
        producto.categoria = request.categoria;
        producto.stock = request.stock;
        producto.stockMinimo = request.stockMinimo;
        producto.precio = request.precio;
        producto.descripcion = request.descripcion;
        producto.persist();

        return producto;
    }

    @Transactional
    public Producto cambiarEstado(Long id, boolean activo) {
        Producto producto = Producto.findById(id);
        if (producto == null) {
            throw new IllegalArgumentException("Producto no encontrado con id: " + id);
        }
        producto.activo = activo;
        producto.persist();
        return producto;
    }

    @Transactional
    public ImportResultadoResponse importar(List<ProductoRequest> items) {
        ImportResultadoResponse resultado = new ImportResultadoResponse();
        if (items == null) {
            return resultado;
        }
        resultado.total = items.size();

        for (ProductoRequest item : items) {
            Optional<Sucursal> sucursalOpt = item.sucursalId != null
                    ? sucursalService.buscarPorId(item.sucursalId)
                    : Optional.empty();

            if (sucursalOpt.isEmpty()) {
                resultado.rechazados.add(new ImportResultadoResponse.RechazoItem(
                        item.codigo, item.sucursalId, "Sucursal no encontrada: " + item.sucursalId));
                continue;
            }

            if (existePorCodigoYSucursal(item.codigo, item.sucursalId)) {
                resultado.rechazados.add(new ImportResultadoResponse.RechazoItem(
                        item.codigo, item.sucursalId,
                        "Ya existe un producto con el código '" + item.codigo
                                + "' en la sucursal " + item.sucursalId));
                continue;
            }

            Producto producto = new Producto();
            producto.codigo = item.codigo;
            producto.nombre = item.nombre;
            producto.sucursal = sucursalOpt.get();
            producto.categoria = item.categoria;
            producto.stock = item.stock != null ? item.stock : 0;
            producto.stockMinimo = item.stockMinimo != null ? item.stockMinimo : 0;
            producto.precio = item.precio != null ? item.precio : java.math.BigDecimal.ZERO;
            producto.descripcion = item.descripcion;
            producto.activo = true;
            producto.fechaActualizacionStock = LocalDateTime.now();
            producto.persist();
            resultado.insertados++;
        }

        return resultado;
    }
}
