package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.DatosClient;
import com.grupofrontera.bff.dto.DatoConsolidadoDTO;
import com.grupofrontera.bff.dto.DatoConsolidadoRequestDTO;
import com.grupofrontera.bff.dto.LogTrazabilidadDTO;
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
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/datos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DatoConsolidadoResource {

    @Inject
    @RestClient
    DatosClient datosClient;

    @POST
    public Response recibir(@Valid DatoConsolidadoRequestDTO request) {
        return datosClient.recibirDato(request);
    }

    @GET
    public List<DatoConsolidadoDTO> consultar(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("tipoDato") String tipoDato,
            @QueryParam("periodoDesde") String periodoDesde,
            @QueryParam("periodoHasta") String periodoHasta,
            @QueryParam("estado") String estado) {
        return datosClient.consultarDatos(sucursalId, tipoDato, periodoDesde, periodoHasta, estado);
    }

    @GET
    @Path("/{id}")
    public DatoConsolidadoDTO obtener(@PathParam("id") Long id) {
        return datosClient.obtenerDato(id);
    }

    @GET
    @Path("/errores")
    public List<DatoConsolidadoDTO> errores() {
        return datosClient.listarErrores();
    }

    @GET
    @Path("/{id}/log")
    public List<LogTrazabilidadDTO> log(@PathParam("id") Long id) {
        return datosClient.obtenerLog(id);
    }

    @POST
    @Path("/{id}/reprocesar")
    public DatoConsolidadoDTO reprocesar(@PathParam("id") Long id) {
        return datosClient.reprocesar(id);
    }

    @GET
    @Path("/reportes/agrupados")
    public Response reporte(
            @QueryParam("periodoDesde") String periodoDesde,
            @QueryParam("periodoHasta") String periodoHasta,
            @QueryParam("tipoAgrupacion") String tipoAgrupacion) {
        return datosClient.reporteAgrupado(periodoDesde, periodoHasta, tipoAgrupacion);
    }
}
