package com.grupofrontera.msusers.resource;

import com.grupofrontera.msusers.dto.UsuarioSucursalRequestDTO;
import com.grupofrontera.msusers.dto.UsuarioSucursalResponseDTO;
import com.grupofrontera.msusers.service.UsuarioSucursalService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/usuario-sucursales")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioSucursalResource {

    @Inject
    UsuarioSucursalService usuarioSucursalService;

    @GET
    public List<UsuarioSucursalResponseDTO> listarActivos() {
        return usuarioSucursalService.listarActivos();
    }

    @POST
    public Response asignarSucursal(UsuarioSucursalRequestDTO dto) {
        UsuarioSucursalResponseDTO created = usuarioSucursalService.asignarSucursal(dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @GET
    @Path("/usuario/{id}")
    public List<UsuarioSucursalResponseDTO> listarSucursalesPorUsuario(@PathParam("id") UUID id) {
        return usuarioSucursalService.listarSucursalesPorUsuario(id);
    }

    @GET
    @Path("/sucursal/{id}")
    public List<UsuarioSucursalResponseDTO> listarUsuariosPorSucursal(@PathParam("id") UUID id) {
        return usuarioSucursalService.listarUsuariosPorSucursal(id);
    }

    @PUT
    @Path("/{id}/desactivar")
    public Response desactivarAsignacion(@PathParam("id") UUID id) {
        usuarioSucursalService.desactivarAsignacion(id);
        return Response.ok().build();
    }
}
