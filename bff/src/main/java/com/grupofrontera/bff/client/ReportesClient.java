package com.grupofrontera.bff.client;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "ms-reportes")
@Path("/reportes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface ReportesClient {

    @GET
    @Path("/dashboard")
    Response obtenerDashboard(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodo") String periodo);

    @GET
    @Path("/exportar")
    Response exportar(
            @QueryParam("formato") String formato,
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodo") String periodo);

    @GET
    @Path("/comparativo")
    Response obtenerComparativo(@QueryParam("periodo") String periodo);

    @GET
    @Path("/inventario")
    Response exportarInventario(
            @QueryParam("formato") String formato,
            @QueryParam("sucursalId") Long sucursalId);
}
