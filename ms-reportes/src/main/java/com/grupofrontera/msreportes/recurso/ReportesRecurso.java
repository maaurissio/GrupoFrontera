package com.grupofrontera.msreportes.recurso;

import com.grupofrontera.msreportes.dto.ReporteDashboard;
import com.grupofrontera.msreportes.servicio.ExportacionServicio;
import com.grupofrontera.msreportes.servicio.ReportesServicio;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/reportes")
public class ReportesRecurso {

    @Inject
    ReportesServicio reportesServicio;

    @Inject
    ExportacionServicio exportacionServicio;

    @GET
    @Path("/dashboard")
    @Produces(MediaType.APPLICATION_JSON)
    public Response obtenerDashboard(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodo") String periodo) {

        if (sucursalId == null || periodo == null || periodo.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Los parametros sucursalId y periodo son obligatorios\"}")
                    .build();
        }

        ReporteDashboard dashboard = reportesServicio.obtenerDashboard(sucursalId, periodo);
        return Response.ok(dashboard).build();
    }

    @GET
    @Path("/exportar")
    public Response exportar(
            @QueryParam("formato") String formato,
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodo") String periodo) {

        if (sucursalId == null || periodo == null || periodo.isBlank() || formato == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Los parametros formato, sucursalId y periodo son obligatorios")
                    .build();
        }

        ReporteDashboard dashboard = reportesServicio.obtenerDashboard(sucursalId, periodo);
        String nombreArchivo = "reporte_sucursal" + sucursalId + "_" + periodo;

        return switch (formato.toLowerCase()) {
            case "pdf" -> {
                byte[] contenidoPdf = exportacionServicio.exportarPdf(dashboard);
                yield Response.ok(contenidoPdf)
                        .type("application/pdf")
                        .header("Content-Disposition", "attachment; filename=\"" + nombreArchivo + ".pdf\"")
                        .build();
            }
            case "xlsx" -> {
                byte[] contenidoExcel = exportacionServicio.exportarExcel(dashboard);
                yield Response.ok(contenidoExcel)
                        .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .header("Content-Disposition", "attachment; filename=\"" + nombreArchivo + ".xlsx\"")
                        .build();
            }
            default -> Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Formato no soportado. Use pdf o xlsx\"}")
                    .build();
        };
    }

    @GET
    @Path("/comparativo")
    @Produces(MediaType.APPLICATION_JSON)
    public Response obtenerComparativo(@QueryParam("periodo") String periodo) {
        if (periodo == null || periodo.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"El parametro periodo es obligatorio\"}")
                    .build();
        }

        List<ReporteDashboard> comparativo = reportesServicio.obtenerComparativo(periodo);
        return Response.ok(comparativo).build();
    }
}
