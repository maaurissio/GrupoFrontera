package com.grupofrontera.msusers.resource;

import com.grupofrontera.msusers.dto.RegionResponseDTO;
import com.grupofrontera.msusers.service.RegionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/regiones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RegionResource {

    @Inject
    RegionService regionService;

    @GET
    public List<RegionResponseDTO> listarTodas() {
        return regionService.listarTodas();
    }
}
