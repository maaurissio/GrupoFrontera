package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.ReportesClient;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
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
    public Response listar() {
        return reportesClient.listarReportes();
    }
}
