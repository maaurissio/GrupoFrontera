package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.KpisClient;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/kpis")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class KpiResource {

    @Inject
    @RestClient
    KpisClient kpisClient;

    @GET
    public Response obtener(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodo") String periodo) {
        return kpisClient.obtenerKpis(sucursalId, periodo);
    }

    @GET
    @Path("/comparativo")
    public Response comparativo(@QueryParam("periodo") String periodo) {
        return kpisClient.obtenerComparativo(periodo);
    }
}
