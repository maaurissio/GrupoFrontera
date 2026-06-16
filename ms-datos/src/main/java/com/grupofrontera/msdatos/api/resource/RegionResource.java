package com.grupofrontera.msdatos.api.resource;

import com.grupofrontera.msdatos.api.dto.RegionRequest;
import com.grupofrontera.msdatos.api.dto.RegionResponse;
import com.grupofrontera.msdatos.domain.entity.Region;
import com.grupofrontera.msdatos.domain.service.RegionService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/regiones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RegionResource {

    @Inject
    RegionService regionService;

    @GET
    public List<RegionResponse> listar() {
        return regionService.listarTodas()
                .stream()
                .map(RegionResponse::fromEntity)
                .toList();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return regionService.buscarPorId(id)
                .map(r -> Response.ok(RegionResponse.fromEntity(r)))
                .orElse(Response.status(Response.Status.NOT_FOUND))
                .build();
    }

    @POST
    public Response crear(@Valid RegionRequest request) {
        if (regionService.buscarPorNombre(request.nombre).isPresent()) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("Ya existe una region con el nombre: " + request.nombre)
                    .build();
        }
        Region region = new Region();
        region.nombre = request.nombre;
        Region creada = regionService.crear(region);
        return Response.status(Response.Status.CREATED)
                .entity(RegionResponse.fromEntity(creada))
                .build();
    }
}
