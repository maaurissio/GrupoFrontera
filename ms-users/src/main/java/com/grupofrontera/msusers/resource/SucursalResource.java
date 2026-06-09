package com.grupofrontera.msusers.resource;

import com.grupofrontera.msusers.dto.SucursalRequestDTO;
import com.grupofrontera.msusers.dto.SucursalResponseDTO;
import com.grupofrontera.msusers.service.SucursalService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/sucursales")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SucursalResource {

    @Inject
    SucursalService sucursalService;

    @GET
    public List<SucursalResponseDTO> listarActivos() {
        return sucursalService.listarActivos();
    }

    @GET
    @Path("/{id}")
    public SucursalResponseDTO obtenerPorId(@PathParam("id") UUID id) {
        return sucursalService.obtenerPorId(id);
    }

    @POST
    public Response crear(SucursalRequestDTO dto) {
        SucursalResponseDTO created = sucursalService.crear(dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public SucursalResponseDTO actualizar(@PathParam("id") UUID id, SucursalRequestDTO dto) {
        return sucursalService.actualizar(id, dto);
    }

    @PUT
    @Path("/{id}/activar")
    public Response activar(@PathParam("id") UUID id) {
        sucursalService.activar(id);
        return Response.ok().build();
    }

    @PUT
    @Path("/{id}/desactivar")
    public Response desactivar(@PathParam("id") UUID id) {
        sucursalService.desactivar(id);
        return Response.ok().build();
    }
}
