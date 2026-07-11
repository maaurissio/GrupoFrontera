package com.grupofrontera.bff.client;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "ms-kpis")
@Path("/ventas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface VentaClient {

    @GET
    Response listar(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodoDesde") String periodoDesde,
            @QueryParam("periodoHasta") String periodoHasta,
            @QueryParam("page") int page,
            @QueryParam("size") int size);

    @GET
    @Path("/{id}")
    Response obtener(@PathParam("id") Long id);
}
