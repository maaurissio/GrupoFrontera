package com.grupofrontera.msusers.resource;

import com.grupofrontera.msusers.dto.UsuarioRolRequestDTO;
import com.grupofrontera.msusers.dto.UsuarioRolResponseDTO;
import com.grupofrontera.msusers.service.UsuarioRolService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/usuario-roles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioRolResource {

    @Inject
    UsuarioRolService usuarioRolService;

    @GET
    public List<UsuarioRolResponseDTO> listarActivos() {
        return usuarioRolService.listarActivos();
    }

    @POST
    public Response asignarRol(UsuarioRolRequestDTO dto) {
        UsuarioRolResponseDTO created = usuarioRolService.asignarRol(dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @GET
    @Path("/usuario/{id}")
    public List<UsuarioRolResponseDTO> listarRolesPorUsuario(@PathParam("id") UUID id) {
        return usuarioRolService.listarRolesPorUsuario(id);
    }

    @GET
    @Path("/rol/{id}")
    public List<UsuarioRolResponseDTO> listarUsuariosPorRol(@PathParam("id") UUID id) {
        return usuarioRolService.listarUsuariosPorRol(id);
    }

    @PUT
    @Path("/{id}/desactivar")
    public Response desactivarAsignacion(@PathParam("id") UUID id) {
        usuarioRolService.desactivarAsignacion(id);
        return Response.ok().build();
    }
}
