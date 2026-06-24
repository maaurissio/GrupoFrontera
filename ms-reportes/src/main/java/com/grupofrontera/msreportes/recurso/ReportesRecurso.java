package com.grupofrontera.msreportes.recurso;

import com.grupofrontera.msreportes.dto.ProductoDto;
import com.grupofrontera.msreportes.dto.ReporteDashboard;
import com.grupofrontera.msreportes.servicio.ExportacionServicio;
import com.grupofrontera.msreportes.servicio.ReporteGeneradoService;
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

    @Inject
    ReporteGeneradoService reporteGeneradoService;

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

        byte[] contenido;
        String tipo;
        if (fmt.equals("pdf")) {
            contenido = exportacionServicio.exportarPdf(dashboard, nombreSucursal);
            tipo = "application/pdf";
            nombreArchivo += ".pdf";
        } else {
            contenido = exportacionServicio.exportarExcel(dashboard, nombreSucursal);
            tipo = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            nombreArchivo += ".xlsx";
        }
        // Solo se registra en el historial una vez que el archivo se generó con exito.
        reporteGeneradoService.registrar("KPIS", fmt, periodo, sucursalId, nombreSucursal);
        return blob(contenido, tipo, nombreArchivo);
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

        byte[] contenido;
        String tipo;
        if (fmt.equals("pdf")) {
            contenido = exportacionServicio.exportarPdfComparativo(filas, periodo, nombres);
            tipo = "application/pdf";
            nombreArchivo += ".pdf";
        } else {
            contenido = exportacionServicio.exportarExcelComparativo(filas, periodo, nombres);
            tipo = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            nombreArchivo += ".xlsx";
        }
        reporteGeneradoService.registrar("KPIS", fmt, periodo, null, null);
        return blob(contenido, tipo, nombreArchivo);
    }

    @GET
    @Path("/inventario")
    public Response exportarInventario(
            @QueryParam("formato") String formato,
            @QueryParam("sucursalId") Long sucursalId) {

        if (formato == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"El parametro formato es obligatorio\"}")
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }

        String fmt = formato.toLowerCase();
        if (!fmt.equals("pdf") && !fmt.equals("xlsx")) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Formato no soportado. Use pdf o xlsx\"}")
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }

        // Lanza 404 (NotFoundException) si no hay productos
        List<ProductoDto> productos = reportesServicio.obtenerInventario(sucursalId);

        boolean consolidado = sucursalId == null;
        String alcance;
        String nombreArchivo;
        if (consolidado) {
            alcance = "Todas las sucursales";
            nombreArchivo = "inventario_consolidado";
        } else {
            alcance = reportesServicio.obtenerNombresSucursales()
                    .getOrDefault(sucursalId, "Sucursal " + sucursalId);
            nombreArchivo = "inventario_sucursal" + sucursalId;
        }

        byte[] contenido;
        String tipo;
        if (fmt.equals("pdf")) {
            contenido = exportacionServicio.exportarInventarioPdf(productos, alcance, consolidado);
            tipo = "application/pdf";
            nombreArchivo += ".pdf";
        } else {
            contenido = exportacionServicio.exportarInventarioExcel(productos, alcance, consolidado);
            tipo = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            nombreArchivo += ".xlsx";
        }
        reporteGeneradoService.registrar("INVENTARIO", fmt, null, sucursalId, consolidado ? null : alcance);
        return blob(contenido, tipo, nombreArchivo);
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
