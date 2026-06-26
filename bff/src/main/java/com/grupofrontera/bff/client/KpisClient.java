package com.grupofrontera.bff.client;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "ms-kpis")
@Path("/kpis")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface KpisClient {

    @GET
    Response obtenerKpis(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodo") String periodo);

    @GET
    @Path("/comparativo")
    Response obtenerComparativo(@QueryParam("periodo") String periodo);

    @PUT
    Response actualizar(Object request);
}
