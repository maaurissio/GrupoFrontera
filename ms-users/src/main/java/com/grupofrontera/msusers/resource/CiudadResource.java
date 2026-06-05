package com.grupofrontera.msusers.resource;

import com.grupofrontera.msusers.dto.CiudadResponseDTO;
import com.grupofrontera.msusers.service.CiudadService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.UUID;

@Path("/ciudades")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CiudadResource {

    @Inject
    CiudadService ciudadService;

    @GET
    public List<CiudadResponseDTO> listarTodas() {
        return ciudadService.listarTodas();
    }

    @GET
    @Path("/region/{regionId}")
    public List<CiudadResponseDTO> listarPorRegion(@PathParam("regionId") UUID regionId) {
        return ciudadService.listarPorRegion(regionId);
    }
}
