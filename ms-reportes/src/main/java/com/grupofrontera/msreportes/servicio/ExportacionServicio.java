package com.grupofrontera.msreportes.servicio;

import com.grupofrontera.msreportes.dto.ReporteDashboard;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.jboss.logging.Logger;

import java.awt.Color;
import java.io.ByteArrayOutputStream;

@ApplicationScoped
public class ExportacionServicio {

    private static final Logger LOG = Logger.getLogger(ExportacionServicio.class);

    public byte[] exportarPdf(ReporteDashboard dashboard) {
        LOG.infof("Generando PDF para sucursalId=%d, periodo=%s", dashboard.sucursalId, dashboard.periodo);
        try (ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            Document documento = new Document(PageSize.A4);
            PdfWriter.getInstance(documento, salida);
            documento.open();

            com.lowagie.text.Font fuenteTitulo    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            com.lowagie.text.Font fuenteSubtitulo = FontFactory.getFont(FontFactory.HELVETICA, 12);
            com.lowagie.text.Font fuenteEncabezado = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            com.lowagie.text.Font fuenteDato      = FontFactory.getFont(FontFactory.HELVETICA, 10);

            documento.add(new Paragraph("Reporte Dashboard Ejecutivo", fuenteTitulo));
            documento.add(new Paragraph("Sucursal: " + dashboard.sucursalId + "  |  Periodo: " + dashboard.periodo, fuenteSubtitulo));
            documento.add(Chunk.NEWLINE);

            PdfPTable tabla = new PdfPTable(2);
            tabla.setWidthPercentage(100);

            agregarFilaEncabezado(tabla, "Indicador", "Valor", fuenteEncabezado);
            agregarFila(tabla, "Total Ventas",           formatearMonto(dashboard.totalVentas), fuenteDato);
            agregarFila(tabla, "Meta Mensual",           formatearMonto(dashboard.metaMensual), fuenteDato);
            agregarFila(tabla, "% Cumplimiento",         dashboard.porcentajeCumplimiento + "%", fuenteDato);
            agregarFila(tabla, "Productos bajo minimo",  String.valueOf(dashboard.productosBajoMinimo), fuenteDato);
            agregarFila(tabla, "Variacion vs periodo anterior", dashboard.variacionPeriodoAnterior + "%", fuenteDato);
            agregarFila(tabla, "Disponibilidad sistema", dashboard.disponibilidadSistema ? "Operativo" : "Caido", fuenteDato);

            documento.add(tabla);
            documento.close();
            return salida.toByteArray();
        } catch (Exception e) {
            LOG.errorf(e, "Error al generar PDF");
            throw new RuntimeException("Error al generar el reporte PDF", e);
        }
    }

    public byte[] exportarExcel(ReporteDashboard dashboard) {
        LOG.infof("Generando Excel para sucursalId=%d, periodo=%s", dashboard.sucursalId, dashboard.periodo);
        try (Workbook libro = new XSSFWorkbook();
             ByteArrayOutputStream salida = new ByteArrayOutputStream()) {

            Sheet hoja = libro.createSheet("Reporte");

            CellStyle estiloEncabezado = libro.createCellStyle();
            org.apache.poi.ss.usermodel.Font fuenteNegrita = libro.createFont();
            fuenteNegrita.setBold(true);
            estiloEncabezado.setFont(fuenteNegrita);

            Row filaEncabezado = hoja.createRow(0);
            filaEncabezado.createCell(0).setCellValue("Indicador");
            filaEncabezado.createCell(1).setCellValue("Valor");
            filaEncabezado.getCell(0).setCellStyle(estiloEncabezado);
            filaEncabezado.getCell(1).setCellStyle(estiloEncabezado);

            String[][] datos = {
                {"Sucursal ID",           String.valueOf(dashboard.sucursalId)},
                {"Periodo",               dashboard.periodo},
                {"Total Ventas",          formatearMonto(dashboard.totalVentas)},
                {"Meta Mensual",          formatearMonto(dashboard.metaMensual)},
                {"% Cumplimiento",        dashboard.porcentajeCumplimiento + "%"},
                {"Productos bajo minimo", String.valueOf(dashboard.productosBajoMinimo)},
                {"Variacion periodo ant.", dashboard.variacionPeriodoAnterior + "%"},
                {"Disponibilidad",        dashboard.disponibilidadSistema ? "Operativo" : "Caido"}
            };

            for (int i = 0; i < datos.length; i++) {
                Row fila = hoja.createRow(i + 1);
                fila.createCell(0).setCellValue(datos[i][0]);
                fila.createCell(1).setCellValue(datos[i][1]);
            }

            hoja.autoSizeColumn(0);
            hoja.autoSizeColumn(1);

            libro.write(salida);
            return salida.toByteArray();
        } catch (Exception e) {
            LOG.errorf(e, "Error al generar Excel");
            throw new RuntimeException("Error al generar el reporte Excel", e);
        }
    }

    private void agregarFilaEncabezado(PdfPTable tabla, String col1, String col2, com.lowagie.text.Font fuente) {
        PdfPCell celda1 = new PdfPCell(new Phrase(col1, fuente));
        PdfPCell celda2 = new PdfPCell(new Phrase(col2, fuente));
        celda1.setBackgroundColor(new Color(33, 64, 154));
        celda2.setBackgroundColor(new Color(33, 64, 154));
        celda1.setPadding(5);
        celda2.setPadding(5);
        tabla.addCell(celda1);
        tabla.addCell(celda2);
    }

    private void agregarFila(PdfPTable tabla, String etiqueta, String valor, com.lowagie.text.Font fuente) {
        PdfPCell celda1 = new PdfPCell(new Phrase(etiqueta, fuente));
        PdfPCell celda2 = new PdfPCell(new Phrase(valor, fuente));
        celda1.setPadding(4);
        celda2.setPadding(4);
        tabla.addCell(celda1);
        tabla.addCell(celda2);
    }

    private String formatearMonto(java.math.BigDecimal monto) {
        if (monto == null) return "0";
        return String.format("$%,.2f", monto);
    }
}
