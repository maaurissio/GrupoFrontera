package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.DatosClient;
import com.grupofrontera.bff.dto.CiudadDTO;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/ciudades")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CiudadResource {

    @Inject
    @RestClient
    DatosClient datosClient;

    @GET
    public List<CiudadDTO> listar(@QueryParam("regionId") Long regionId) {
        return datosClient.listarCiudades(regionId);
    }

    @POST
    public Response crear(CiudadDTO request) {
        return datosClient.crearCiudad(request);
    }
}
