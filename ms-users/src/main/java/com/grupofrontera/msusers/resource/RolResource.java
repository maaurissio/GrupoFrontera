package com.grupofrontera.msusers.resource;

import com.grupofrontera.msusers.dto.RolRequestDTO;
import com.grupofrontera.msusers.dto.RolResponseDTO;
import com.grupofrontera.msusers.service.RolService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/roles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RolResource {

    @Inject
    RolService rolService;

    @GET
    public List<RolResponseDTO> listarActivos() {
        return rolService.listarActivos();
    }

    @GET
    @Path("/{id}")
    public RolResponseDTO obtenerPorId(@PathParam("id") UUID id) {
        return rolService.obtenerPorId(id);
    }

    @POST
    public Response crear(RolRequestDTO dto) {
        RolResponseDTO created = rolService.crear(dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public RolResponseDTO actualizar(@PathParam("id") UUID id, RolRequestDTO dto) {
        return rolService.actualizar(id, dto);
    }

    @PUT
    @Path("/{id}/activar")
    public Response activar(@PathParam("id") UUID id) {
        rolService.activar(id);
        return Response.ok().build();
    }

    @PUT
    @Path("/{id}/desactivar")
    public Response desactivar(@PathParam("id") UUID id) {
        rolService.desactivar(id);
        return Response.ok().build();
    }
}
