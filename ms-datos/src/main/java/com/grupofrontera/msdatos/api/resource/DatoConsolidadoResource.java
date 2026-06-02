package com.grupofrontera.msdatos.api.resource;

import com.grupofrontera.msdatos.api.dto.DatoConsolidadoRequest;
import com.grupofrontera.msdatos.api.dto.DatoConsolidadoResponse;
import com.grupofrontera.msdatos.api.dto.LogTrazabilidadResponse;
import com.grupofrontera.msdatos.domain.entity.DatoConsolidado;
import com.grupofrontera.msdatos.domain.entity.EstadoDato;
import com.grupofrontera.msdatos.domain.service.DatoConsolidadoService;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/api/v1/datos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DatoConsolidadoResource {

    @Inject
    DatoConsolidadoService datoService;

    @POST
    public Response recibirDato(@Valid DatoConsolidadoRequest request) {
        try {
            DatoConsolidado dato = datoService.recibirDato(
                    request.fuenteId,
                    request.sucursalId,
                    request.tipoDato,
                    request.periodo,
                    request.valor
            );
            return Response.status(Response.Status.CREATED)
                    .entity(DatoConsolidadoResponse.fromEntity(dato))
                    .build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    public List<DatoConsolidadoResponse> consultar(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("tipoDato") String tipoDato,
            @QueryParam("periodoDesde") String periodoDesde,
            @QueryParam("periodoHasta") String periodoHasta,
            @QueryParam("estado") String estado) {

        LocalDate desde = periodoDesde != null ? LocalDate.parse(periodoDesde) : null;
        LocalDate hasta = periodoHasta != null ? LocalDate.parse(periodoHasta) : null;
        EstadoDato estadoEnum = estado != null ? EstadoDato.valueOf(estado.toUpperCase()) : null;

        return datoService.listarConFiltros(sucursalId, tipoDato, desde, hasta, estadoEnum)
                .stream()
                .map(DatoConsolidadoResponse::fromEntity)
                .toList();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return datoService.buscarPorId(id)
                .map(d -> Response.ok(DatoConsolidadoResponse.fromEntity(d)))
                .orElse(Response.status(Response.Status.NOT_FOUND))
                .build();
    }

    @GET
    @Path("/errores")
    public List<DatoConsolidadoResponse> listarErrores() {
        return datoService.listarPorEstado(EstadoDato.ERROR)
                .stream()
                .map(DatoConsolidadoResponse::fromEntity)
                .toList();
    }

    @GET
    @Path("/{id}/log")
    public Response obtenerLog(@PathParam("id") Long id) {
        if (datoService.buscarPorId(id).isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("Dato no encontrado con id: " + id)
                    .build();
        }
        return Response.ok(
                datoService.obtenerLogs(id)
                        .stream()
                        .map(LogTrazabilidadResponse::fromEntity)
                        .toList()
        ).build();
    }

    @POST
    @Path("/{id}/reprocesar")
    public Response reprocesar(@PathParam("id") Long id) {
        try {
            DatoConsolidado dato = datoService.reprocesar(id);
            return Response.ok(DatoConsolidadoResponse.fromEntity(dato)).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/reportes/agrupados")
    public Response reporteAgrupado(
            @QueryParam("periodoDesde") String periodoDesde,
            @QueryParam("periodoHasta") String periodoHasta,
            @QueryParam("tipoAgrupacion") String tipoAgrupacion) {

        LocalDate desde = periodoDesde != null ? LocalDate.parse(periodoDesde) : LocalDate.now().minusMonths(1);
        LocalDate hasta = periodoHasta != null ? LocalDate.parse(periodoHasta) : LocalDate.now();

        List<DatoConsolidado> datos = datoService.listarConFiltros(null, null, desde, hasta, EstadoDato.PROCESADO);

        var agrupados = datos.stream()
                .collect(Collectors.groupingBy(d -> {
                    if ("semanal".equalsIgnoreCase(tipoAgrupacion)) {
                        return String.format("%d-W%02d", d.periodo.getYear(), d.periodo.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR));
                    } else if ("mensual".equalsIgnoreCase(tipoAgrupacion)) {
                        return d.periodo.getYear() + "-" + String.format("%02d", d.periodo.getMonthValue());
                    }
                    return d.periodo.toString();
                }));

        return Response.ok(agrupados).build();
    }
}
