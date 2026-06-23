package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.ReportesClient;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/reportes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReporteResource {

    @Inject
    @RestClient
    ReportesClient reportesClient;

    @GET
    @Path("/dashboard")
    public Response dashboard(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodo") String periodo) {
        return reportesClient.obtenerDashboard(sucursalId, periodo);
    }

    @GET
    @Path("/exportar")
    public Response exportar(
            @QueryParam("formato") String formato,
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodo") String periodo) {
        return reportesClient.exportar(formato, sucursalId, periodo);
    }

    @GET
    @Path("/comparativo")
    public Response comparativo(@QueryParam("periodo") String periodo) {
        return reportesClient.obtenerComparativo(periodo);
    }

    @GET
    @Path("/inventario")
    public Response inventario(
            @QueryParam("formato") String formato,
            @QueryParam("sucursalId") Long sucursalId) {
        return reportesClient.exportarInventario(formato, sucursalId);
    }
}
