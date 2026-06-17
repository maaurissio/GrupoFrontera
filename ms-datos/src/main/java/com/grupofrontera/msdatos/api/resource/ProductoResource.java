package com.grupofrontera.msdatos.api.resource;

import com.grupofrontera.msdatos.api.dto.EstadoRequest;
import com.grupofrontera.msdatos.api.dto.ImportResultadoResponse;
import com.grupofrontera.msdatos.api.dto.ProductoRequest;
import com.grupofrontera.msdatos.api.dto.ProductoResponse;
import com.grupofrontera.msdatos.domain.entity.CategoriaProducto;
import com.grupofrontera.msdatos.domain.entity.Producto;
import com.grupofrontera.msdatos.domain.service.ProductoService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Arrays;
import java.util.List;

@Path("/api/v1/productos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductoResource {

    @Inject
    ProductoService productoService;

    @GET
    public List<ProductoResponse> listar(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("categoria") String categoria,
            @QueryParam("q") String q,
            @QueryParam("activo") Boolean activo) {

        return productoService.listarConFiltros(sucursalId, categoria, q, activo)
                .stream()
                .map(ProductoResponse::fromEntity)
                .toList();
    }

    @GET
    @Path("/categorias")
    public List<String> listarCategorias() {
        return Arrays.stream(CategoriaProducto.values())
                .map(Enum::name)
                .toList();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return productoService.buscarPorId(id)
                .map(p -> Response.ok(ProductoResponse.fromEntity(p)))
                .orElse(Response.status(Response.Status.NOT_FOUND))
                .build();
    }

    @POST
    public Response crear(@Valid ProductoRequest request) {
        Producto producto = productoService.crear(request);
        return Response.status(Response.Status.CREATED)
                .entity(ProductoResponse.fromEntity(producto))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Long id, @Valid ProductoRequest request) {
        try {
            Producto producto = productoService.actualizar(id, request);
            return Response.ok(ProductoResponse.fromEntity(producto)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(e.getMessage())
                    .build();
        }
    }

    @PUT
    @Path("/{id}/estado")
    public Response cambiarEstado(@PathParam("id") Long id, @Valid EstadoRequest request) {
        try {
            Producto producto = productoService.cambiarEstado(id, request.activo);
            return Response.ok(ProductoResponse.fromEntity(producto)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(e.getMessage())
                    .build();
        }
    }

    @POST
    @Path("/importar")
    public Response importar(@Valid List<ProductoRequest> items) {
        ImportResultadoResponse resultado = productoService.importar(items);
        return Response.ok(resultado).build();
    }
}
