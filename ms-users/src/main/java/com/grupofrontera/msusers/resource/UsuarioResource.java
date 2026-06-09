package com.grupofrontera.msusers.resource;

import com.grupofrontera.msusers.dto.UsuarioRequestDTO;
import com.grupofrontera.msusers.dto.UsuarioResponseDTO;
import com.grupofrontera.msusers.dto.UsuarioUpdateRequestDTO;
import com.grupofrontera.msusers.service.UsuarioService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioResource {

    @Inject
    UsuarioService usuarioService;

    @GET
    public List<UsuarioResponseDTO> listarActivos() {
        return usuarioService.listarActivos();
    }

    @GET
    @Path("/todos")
    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioService.listarTodos();
    }

    @GET
    @Path("/{id}")
    public UsuarioResponseDTO obtenerPorId(@PathParam("id") UUID id) {
        return usuarioService.obtenerPorId(id);
    }

    @GET
    @Path("/buscar")
    public List<UsuarioResponseDTO> buscarPorNombre(@QueryParam("nombre") String nombre) {
        return usuarioService.buscarPorNombre(nombre != null ? nombre : "");
    }

    @POST
    public Response crear(UsuarioRequestDTO dto) {
        UsuarioResponseDTO created = usuarioService.crear(dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public UsuarioResponseDTO actualizar(@PathParam("id") UUID id, UsuarioUpdateRequestDTO dto) {
        return usuarioService.actualizar(id, dto);
    }

    @PUT
    @Path("/{id}/activar")
    public Response activar(@PathParam("id") UUID id) {
        usuarioService.activar(id);
        return Response.ok().build();
    }

    @PUT
    @Path("/{id}/desactivar")
    public Response desactivar(@PathParam("id") UUID id) {
        usuarioService.desactivar(id);
        return Response.ok().build();
    }
}
