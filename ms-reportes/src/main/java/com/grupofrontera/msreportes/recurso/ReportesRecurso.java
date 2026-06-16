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

        if (periodo == null || periodo.isBlank() || formato == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Los parametros formato y periodo son obligatorios")
                    .build();
        }

        String fmt = formato.toLowerCase();
        if (!fmt.equals("pdf") && !fmt.equals("xlsx")) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Formato no soportado. Use pdf o xlsx\"}")
                    .build();
        }

        // Sin sucursalId → reporte consolidado de TODAS las sucursales
        if (sucursalId == null) {
            return exportarConsolidado(fmt, periodo);
        }
        return exportarIndividual(fmt, sucursalId, periodo);
    }

    private Response exportarIndividual(String fmt, Long sucursalId, String periodo) {
        ReporteDashboard dashboard = reportesServicio.obtenerDashboard(sucursalId, periodo);
        String nombreSucursal = reportesServicio.obtenerNombresSucursales()
                .getOrDefault(sucursalId, "Sucursal " + sucursalId);
        String nombreArchivo = "reporte_sucursal" + sucursalId + "_" + periodo;

        if (fmt.equals("pdf")) {
            byte[] pdf = exportacionServicio.exportarPdf(dashboard, nombreSucursal);
            return blob(pdf, "application/pdf", nombreArchivo + ".pdf");
        }
        byte[] xls = exportacionServicio.exportarExcel(dashboard, nombreSucursal);
        return blob(xls, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nombreArchivo + ".xlsx");
    }

    private Response exportarConsolidado(String fmt, String periodo) {
        List<ReporteDashboard> filas = reportesServicio.obtenerComparativo(periodo);
        if (filas == null || filas.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"No hay KPIs para ninguna sucursal en el periodo " + periodo + "\"}")
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
        var nombres = reportesServicio.obtenerNombresSucursales();
        String nombreArchivo = "reporte_consolidado_" + periodo;

        if (fmt.equals("pdf")) {
            byte[] pdf = exportacionServicio.exportarPdfComparativo(filas, periodo, nombres);
            return blob(pdf, "application/pdf", nombreArchivo + ".pdf");
        }
        byte[] xls = exportacionServicio.exportarExcelComparativo(filas, periodo, nombres);
        return blob(xls, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nombreArchivo + ".xlsx");
    }

    private Response blob(byte[] contenido, String tipo, String nombreArchivo) {
        return Response.ok(contenido)
                .type(tipo)
                .header("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"")
                .build();
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
