package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.DatosClient;
import com.grupofrontera.bff.dto.EstadoDTO;
import com.grupofrontera.bff.dto.ProductoDTO;
import com.grupofrontera.bff.dto.ProductoRequestDTO;
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
import java.util.List;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/productos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductoResource {

    @Inject
    @RestClient
    DatosClient datosClient;

    @GET
    public List<ProductoDTO> listar(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("categoria") String categoria,
            @QueryParam("q") String q,
            @QueryParam("activo") Boolean activo) {
        return datosClient.listarProductos(sucursalId, categoria, q, activo);
    }

    @GET
    @Path("/categorias")
    public List<String> categorias() {
        return datosClient.listarCategorias();
    }

    @GET
    @Path("/{id}")
    public ProductoDTO obtener(@PathParam("id") Long id) {
        return datosClient.obtenerProducto(id);
    }

    @POST
    public Response crear(@Valid ProductoRequestDTO request) {
        return datosClient.crearProducto(request);
    }

    @PUT
    @Path("/{id}")
    public ProductoDTO actualizar(@PathParam("id") Long id, @Valid ProductoRequestDTO request) {
        return datosClient.actualizarProducto(id, request);
    }

    @PUT
    @Path("/{id}/estado")
    public ProductoDTO cambiarEstado(@PathParam("id") Long id, @Valid EstadoDTO request) {
        return datosClient.cambiarEstadoProducto(id, request);
    }

    @POST
    @Path("/importar")
    public Response importar(List<ProductoRequestDTO> request) {
        return datosClient.importarProductos(request);
    }
}
