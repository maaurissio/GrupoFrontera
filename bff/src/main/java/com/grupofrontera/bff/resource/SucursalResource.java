package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.DatosClient;
import com.grupofrontera.bff.client.UsersClient;
import com.grupofrontera.bff.dto.EstadoDTO;
import com.grupofrontera.bff.dto.SucursalDTO;
import com.grupofrontera.bff.dto.SucursalRequestDTO;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/sucursales")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SucursalResource {

    @Inject
    @RestClient
    DatosClient datosClient;

    @Inject
    @RestClient
    UsersClient usersClient;

    @POST
    public Response crear(@Valid SucursalRequestDTO request) {
        return datosClient.crearSucursal(request);
    }

    @GET
    public List<SucursalDTO> listar() {
        return datosClient.listarSucursales();
    }

    @GET
    @Path("/{id}")
    public SucursalDTO obtener(@PathParam("id") Long id) {
        return datosClient.obtenerSucursal(id);
    }

    @PUT
    @Path("/{id}")
    public SucursalDTO actualizar(@PathParam("id") Long id, @Valid SucursalRequestDTO request) {
        return datosClient.actualizarSucursal(id, request);
    }

    @PUT
    @Path("/{id}/estado")
    public SucursalDTO cambiarEstado(@PathParam("id") Long id, @Valid EstadoDTO request) {
        return datosClient.cambiarEstadoSucursal(id, request);
    }

    // Direccion inversa de /api/bff/usuarios/{id}/sucursales: usuarios asignados a una sucursal.
    @GET
    @Path("/{id}/usuarios")
    public List<Object> listarUsuarios(@PathParam("id") Long id) {
        return usersClient.listarUsuariosPorSucursal(id);
    }
}
