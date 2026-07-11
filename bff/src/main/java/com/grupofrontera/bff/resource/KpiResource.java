package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.KpisClient;
import com.grupofrontera.bff.client.VentaClient;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
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

    @Inject
    @RestClient
    VentaClient ventaClient;

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

    @PUT
    public Response actualizar(Object request) {
        return kpisClient.actualizar(request);
    }

    @GET
    @Path("/ventas")
    public Response listarVentas(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodoDesde") String periodoDesde,
            @QueryParam("periodoHasta") String periodoHasta,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return ventaClient.listar(sucursalId, periodoDesde, periodoHasta, page, size);
    }

    @GET
    @Path("/ventas/{id}")
    public Response obtenerVenta(@PathParam("id") Long id) {
        return ventaClient.obtener(id);
    }
}
