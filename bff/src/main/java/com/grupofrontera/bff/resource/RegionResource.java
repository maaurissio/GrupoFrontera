package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.DatosClient;
import com.grupofrontera.bff.dto.RegionDTO;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/regiones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RegionResource {

    @Inject
    @RestClient
    DatosClient datosClient;

    @GET
    public List<RegionDTO> listar() {
        return datosClient.listarRegiones();
    }

    @POST
    public Response crear(RegionDTO request) {
        return datosClient.crearRegion(request);
    }
}
