package com.grupofrontera.msdatos.api.resource;

import com.grupofrontera.msdatos.api.dto.CiudadRequest;
import com.grupofrontera.msdatos.api.dto.CiudadResponse;
import com.grupofrontera.msdatos.domain.entity.Ciudad;
import com.grupofrontera.msdatos.domain.entity.Region;
import com.grupofrontera.msdatos.domain.service.CiudadService;
import com.grupofrontera.msdatos.domain.service.RegionService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/ciudades")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CiudadResource {

    @Inject
    CiudadService ciudadService;

    @Inject
    RegionService regionService;

    @GET
    public List<CiudadResponse> listar(@QueryParam("regionId") Long regionId) {
        List<Ciudad> ciudades = (regionId != null)
                ? ciudadService.listarPorRegion(regionId)
                : ciudadService.listarTodas();
        return ciudades.stream()
                .map(CiudadResponse::fromEntity)
                .toList();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return ciudadService.buscarPorId(id)
                .map(c -> Response.ok(CiudadResponse.fromEntity(c)))
                .orElse(Response.status(Response.Status.NOT_FOUND))
                .build();
    }

    @POST
    public Response crear(@Valid CiudadRequest request) {
        Region region = regionService.buscarPorId(request.regionId).orElse(null);
        if (region == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("No existe la region con id: " + request.regionId)
                    .build();
        }
        Ciudad ciudad = new Ciudad();
        ciudad.nombre = request.nombre;
        ciudad.region = region;
        Ciudad creada = ciudadService.crear(ciudad);
        return Response.status(Response.Status.CREATED)
                .entity(CiudadResponse.fromEntity(creada))
                .build();
    }
}
