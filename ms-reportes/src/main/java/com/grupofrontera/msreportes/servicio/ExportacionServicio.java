package com.grupofrontera.msreportes.servicio;

import com.grupofrontera.msreportes.dto.ProductoDto;
import com.grupofrontera.msreportes.dto.ReporteDashboard;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.jboss.logging.Logger;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class ExportacionServicio {

    private static final Logger LOG = Logger.getLogger(ExportacionServicio.class);

    // Paleta corporativa
    private static final Color AZUL        = new Color(30, 58, 138);    // azul oscuro corporativo
    private static final Color AZUL_BANDA  = new Color(37, 99, 235);
    private static final Color FILA_ALT    = new Color(244, 247, 251);  // gris muy claro
    private static final Color BORDE       = new Color(214, 220, 228);
    private static final Color TXT_SUAVE   = new Color(110, 119, 129);
    private static final Color VERDE       = new Color(21, 128, 61);
    private static final Color AMBAR       = new Color(180, 122, 6);
    private static final Color ROJO        = new Color(190, 30, 45);

    private static final DateTimeFormatter FECHA_FMT = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");
    private static final Locale LOCALE_CL = new Locale("es", "CL");

    // ================================================================
    //  PDF — sucursal individual
    // ================================================================
    public byte[] exportarPdf(ReporteDashboard dashboard, String nombreSucursal, List<ProductoDto> productos) {
        boolean conProductos = productos != null && !productos.isEmpty();
        LOG.infof("Generando PDF individual sucursal=%d periodo=%s productos=%d",
                dashboard.sucursalId, dashboard.periodo, conProductos ? productos.size() : 0);
        try (ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            // Landscape cuando hay inventario (tabla de 7 cols)
            Rectangle tamano = conProductos ? PageSize.A4.rotate() : PageSize.A4;
            Document doc = new Document(tamano, 40, 40, 90, 60);
            PdfWriter writer = PdfWriter.getInstance(doc, salida);
            writer.setPageEvent(new PieDePagina());
            doc.open();

            encabezado(doc, "Informe de Gestión por Sucursal");
            subtituloAlcance(doc, nombreSucursal, dashboard.periodo);

            // Tarjetas de KPIs
            int nCols = conProductos ? 4 : 2;
            PdfPTable cards = new PdfPTable(nCols);
            cards.setWidthPercentage(100);
            cards.setSpacingBefore(6);
            tarjeta(cards, "Total de ventas", clp(dashboard.totalVentas), AZUL);
            tarjeta(cards, "Meta mensual", clp(dashboard.metaMensual), TXT_SUAVE.darker());
            tarjeta(cards, "Cumplimiento de meta",
                    pct(dashboard.porcentajeCumplimiento), colorCumplimiento(dashboard.porcentajeCumplimiento));
            tarjeta(cards, "Variación vs. mes anterior",
                    pctSigno(dashboard.variacionPeriodoAnterior), colorVariacion(dashboard.variacionPeriodoAnterior));
            doc.add(cards);

            // Tabla de KPIs
            PdfPTable t = tablaBase(new float[]{2.4f, 1.6f});
            celdaEncabezado(t, "Indicador");
            celdaEncabezado(t, "Valor");
            boolean alt = false;
            alt = filaDetalle(t, "Total de ventas", clp(dashboard.totalVentas), alt);
            alt = filaDetalle(t, "Meta mensual", clp(dashboard.metaMensual), alt);
            alt = filaDetalle(t, "Cumplimiento de meta", pct(dashboard.porcentajeCumplimiento), alt);
            alt = filaDetalle(t, "Productos bajo mínimo", String.valueOf(nz(dashboard.productosBajoMinimo)), alt);
            alt = filaDetalle(t, "Variación período anterior", pctSigno(dashboard.variacionPeriodoAnterior), alt);
            alt = filaDetalle(t, "Disponibilidad del sistema",
                    dashboard.disponibilidadSistema ? "Operativo" : "Caído", alt);
            doc.add(espacio(10));
            doc.add(t);

            // Sección de inventario detallado
            if (conProductos) {
                doc.add(espacio(18));
                com.lowagie.text.Paragraph titInv = new com.lowagie.text.Paragraph(
                        "Detalle de Inventario — " + nombreSucursal,
                        FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, AZUL));
                titInv.setSpacingAfter(6);
                doc.add(titInv);

                int totStock = 0;
                BigDecimal totVal = BigDecimal.ZERO;
                for (ProductoDto p : productos) { totStock += nz(p.stock); totVal = totVal.add(valorizado(p)); }

                PdfPTable resInv = new PdfPTable(3);
                resInv.setWidthPercentage(60);
                resInv.setSpacingBefore(4);
                resInv.setSpacingAfter(8);
                tarjeta(resInv, "Productos", String.valueOf(productos.size()), AZUL);
                tarjeta(resInv, "Stock total", num(totStock), AZUL);
                tarjeta(resInv, "Valorizado", clp(totVal), AZUL);
                doc.add(resInv);

                doc.add(tablaInventario(productos, true));
            }

            doc.close();
            return salida.toByteArray();
        } catch (Exception e) {
            LOG.errorf(e, "Error al generar PDF individual");
            throw new RuntimeException("Error al generar el informe PDF", e);
        }
    }

    // ================================================================
    //  PDF — consolidado de todas las sucursales
    // ================================================================
    public byte[] exportarPdfComparativo(List<ReporteDashboard> filas, String periodo, Map<Long, String> nombres, List<ProductoDto> productos) {
        LOG.infof("Generando PDF consolidado periodo=%s (%d sucursales)", periodo, filas.size());
        try (ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4.rotate(), 40, 40, 90, 60);
            PdfWriter writer = PdfWriter.getInstance(doc, salida);
            writer.setPageEvent(new PieDePagina());
            doc.open();

            encabezado(doc, "Reporte Consolidado de Sucursales");
            subtituloAlcance(doc, "Todas las sucursales", periodo);

            // Resumen ejecutivo (totales)
            BigDecimal totalVentas = BigDecimal.ZERO;
            BigDecimal totalMeta = BigDecimal.ZERO;
            int totalBajoMin = 0;
            for (ReporteDashboard d : filas) {
                totalVentas = totalVentas.add(nz(d.totalVentas));
                totalMeta = totalMeta.add(nz(d.metaMensual));
                totalBajoMin += nz(d.productosBajoMinimo);
            }
            BigDecimal cumplGlobal = totalMeta.signum() > 0
                    ? totalVentas.multiply(BigDecimal.valueOf(100)).divide(totalMeta, 1, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            PdfPTable cards = new PdfPTable(4);
            cards.setWidthPercentage(100);
            cards.setSpacingBefore(6);
            tarjeta(cards, "Sucursales", String.valueOf(filas.size()), AZUL);
            tarjeta(cards, "Ventas totales", clp(totalVentas), AZUL);
            tarjeta(cards, "Cumplimiento global", pct(cumplGlobal), colorCumplimiento(cumplGlobal));
            tarjeta(cards, "Productos bajo mínimo", String.valueOf(totalBajoMin), TXT_SUAVE.darker());
            doc.add(cards);
            doc.add(espacio(12));

            // Tabla comparativa
            PdfPTable t = tablaBase(new float[]{0.6f, 2.4f, 2f, 2f, 1.6f, 1.6f});
            celdaEncabezado(t, "#");
            celdaEncabezado(t, "Sucursal");
            celdaEncabezado(t, "Total ventas");
            celdaEncabezado(t, "Meta mensual");
            celdaEncabezado(t, "% Meta");
            celdaEncabezado(t, "Bajo mín.");

            int rank = 1;
            boolean alt = false;
            for (ReporteDashboard d : filas) {
                Color bg = alt ? FILA_ALT : Color.WHITE;
                String nombre = nombres.getOrDefault(d.sucursalId, "Sucursal " + d.sucursalId);
                celdaTxt(t, String.valueOf(rank++), bg, Element.ALIGN_CENTER, Color.BLACK);
                celdaTxt(t, nombre, bg, Element.ALIGN_LEFT, Color.BLACK);
                celdaTxt(t, clp(d.totalVentas), bg, Element.ALIGN_RIGHT, Color.BLACK);
                celdaTxt(t, clp(d.metaMensual), bg, Element.ALIGN_RIGHT, TXT_SUAVE);
                celdaTxt(t, pct(d.porcentajeCumplimiento), bg, Element.ALIGN_RIGHT, colorCumplimiento(d.porcentajeCumplimiento));
                celdaTxt(t, String.valueOf(nz(d.productosBajoMinimo)), bg, Element.ALIGN_CENTER, TXT_SUAVE);
                alt = !alt;
            }
            // Fila de totales
            celdaTotal(t, "", Element.ALIGN_CENTER);
            celdaTotal(t, "TOTAL", Element.ALIGN_LEFT);
            celdaTotal(t, clp(totalVentas), Element.ALIGN_RIGHT);
            celdaTotal(t, clp(totalMeta), Element.ALIGN_RIGHT);
            celdaTotal(t, pct(cumplGlobal), Element.ALIGN_RIGHT);
            celdaTotal(t, String.valueOf(totalBajoMin), Element.ALIGN_CENTER);

            doc.add(t);

            // Sección de inventario por sucursal
            if (productos != null && !productos.isEmpty()) {
                doc.add(espacio(20));
                com.lowagie.text.Paragraph titInv = new com.lowagie.text.Paragraph(
                        "Detalle de Inventario por Sucursal",
                        FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, AZUL));
                titInv.setSpacingAfter(8);
                doc.add(titInv);

                Map<Long, List<ProductoDto>> porSucursal = productos.stream()
                        .collect(Collectors.groupingBy(
                                p -> p.sucursalId == null ? -1L : p.sucursalId,
                                LinkedHashMap::new, Collectors.toList()));
                for (Map.Entry<Long, List<ProductoDto>> grupo : porSucursal.entrySet()) {
                    List<ProductoDto> items = grupo.getValue();
                    String nomSuc = items.isEmpty() || items.get(0).sucursalNombre == null
                            ? "Sucursal " + grupo.getKey() : items.get(0).sucursalNombre;
                    com.lowagie.text.Paragraph titSuc = new com.lowagie.text.Paragraph(nomSuc,
                            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, AZUL));
                    titSuc.setSpacingBefore(10);
                    titSuc.setSpacingAfter(4);
                    doc.add(titSuc);
                    doc.add(tablaInventario(items, true));
                }
            }

            doc.close();
            return salida.toByteArray();
        } catch (Exception e) {
            LOG.errorf(e, "Error al generar PDF consolidado");
            throw new RuntimeException("Error al generar el informe consolidado PDF", e);
        }
    }

    // ================================================================
    //  Excel — sucursal individual
    // ================================================================
    public byte[] exportarExcel(ReporteDashboard dashboard, String nombreSucursal, List<ProductoDto> productos) {
        LOG.infof("Generando Excel individual sucursal=%d periodo=%s", dashboard.sucursalId, dashboard.periodo);
        try (Workbook libro = new XSSFWorkbook(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            // --- Hoja 1: KPIs ---
            Sheet hoja = libro.createSheet("KPIs");
            hoja.setColumnWidth(0, 8000);
            hoja.setColumnWidth(1, 6000);

            CellStyle titulo = estiloTitulo(libro);
            CellStyle encab = estiloEncabezado(libro);
            CellStyle txt = estiloTexto(libro, false);
            CellStyle txtAlt = estiloTexto(libro, true);

            int r = 0;
            Row rt = hoja.createRow(r++);
            rt.createCell(0).setCellValue("Informe de Gestión — " + nombreSucursal + " · " + dashboard.periodo);
            rt.getCell(0).setCellStyle(titulo);
            hoja.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 1));
            r++;

            Row rh = hoja.createRow(r++);
            celdaXls(rh, 0, "Indicador", encab);
            celdaXls(rh, 1, "Valor", encab);

            String[][] datos = {
                {"Total de ventas", clp(dashboard.totalVentas)},
                {"Meta mensual", clp(dashboard.metaMensual)},
                {"Cumplimiento de meta", pct(dashboard.porcentajeCumplimiento)},
                {"Productos bajo mínimo", String.valueOf(nz(dashboard.productosBajoMinimo))},
                {"Variación período anterior", pctSigno(dashboard.variacionPeriodoAnterior)},
                {"Disponibilidad del sistema", dashboard.disponibilidadSistema ? "Operativo" : "Caído"},
            };
            boolean alt = false;
            for (String[] d : datos) {
                Row row = hoja.createRow(r++);
                celdaXls(row, 0, d[0], alt ? txtAlt : txt);
                celdaXls(row, 1, d[1], alt ? txtAlt : txt);
                alt = !alt;
            }

            // --- Hoja 2: Inventario de productos ---
            if (!productos.isEmpty()) {
                Sheet hojaInv = libro.createSheet("Inventario");
                hojaInv.setColumnWidth(0, 4000);
                hojaInv.setColumnWidth(1, 10000);
                hojaInv.setColumnWidth(2, 5000);
                for (int c = 3; c <= 6; c++) hojaInv.setColumnWidth(c, 4500);

                CellStyle tituloInv = estiloTitulo(libro);
                CellStyle encabInv = estiloEncabezado(libro);
                CellStyle txtInv = estiloTexto(libro, false);
                CellStyle txtAltInv = estiloTexto(libro, true);
                CellStyle totalInv = estiloTotal(libro);

                int ri = 0;
                Row rtInv = hojaInv.createRow(ri++);
                rtInv.createCell(0).setCellValue("Inventario de Productos — " + nombreSucursal);
                rtInv.getCell(0).setCellStyle(tituloInv);
                hojaInv.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 6));
                ri++;

                String[] cols = {"Código", "Producto", "Categoría", "Stock", "Mínimo", "Precio", "Valorizado"};
                Row rhInv = hojaInv.createRow(ri++);
                for (int c = 0; c < cols.length; c++) celdaXls(rhInv, c, cols[c], encabInv);

                int totStock = 0;
                BigDecimal totValorizado = BigDecimal.ZERO;
                boolean altInv = false;
                for (ProductoDto p : productos) {
                    Row row = hojaInv.createRow(ri++);
                    escribirFilaProducto(row, p, altInv ? txtAltInv : txtInv);
                    totStock += nz(p.stock);
                    totValorizado = totValorizado.add(valorizado(p));
                    altInv = !altInv;
                }
                Row rtot = hojaInv.createRow(ri);
                celdaXls(rtot, 0, "", totalInv);
                celdaXls(rtot, 1, "TOTAL", totalInv);
                celdaXls(rtot, 2, "", totalInv);
                celdaXls(rtot, 3, num(totStock), totalInv);
                celdaXls(rtot, 4, "", totalInv);
                celdaXls(rtot, 5, "", totalInv);
                celdaXls(rtot, 6, clp(totValorizado), totalInv);
            }

            libro.write(salida);
            return salida.toByteArray();
        } catch (Exception e) {
            LOG.errorf(e, "Error al generar Excel individual");
            throw new RuntimeException("Error al generar el reporte Excel", e);
        }
    }

    // ================================================================
    //  Excel — consolidado de todas las sucursales
    // ================================================================
    public byte[] exportarExcelComparativo(List<ReporteDashboard> filas, String periodo, Map<Long, String> nombres, List<ProductoDto> productos) {
        LOG.infof("Generando Excel consolidado periodo=%s (%d sucursales)", periodo, filas.size());
        try (Workbook libro = new XSSFWorkbook(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            // --- Hoja 1: KPIs comparativo ---
            Sheet hoja = libro.createSheet("KPIs");
            hoja.setColumnWidth(0, 1600);
            hoja.setColumnWidth(1, 8000);
            for (int c = 2; c <= 5; c++) hoja.setColumnWidth(c, 5000);

            CellStyle titulo = estiloTitulo(libro);
            CellStyle encab = estiloEncabezado(libro);
            CellStyle txt = estiloTexto(libro, false);
            CellStyle txtAlt = estiloTexto(libro, true);
            CellStyle total = estiloTotal(libro);

            int r = 0;
            Row rt = hoja.createRow(r++);
            rt.createCell(0).setCellValue("Informe Consolidado de Sucursales · " + periodo);
            rt.getCell(0).setCellStyle(titulo);
            hoja.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 5));
            r++;

            Row rh = hoja.createRow(r++);
            String[] cols = {"#", "Sucursal", "Total ventas", "Meta mensual", "% Meta", "Bajo mín."};
            for (int c = 0; c < cols.length; c++) celdaXls(rh, c, cols[c], encab);

            BigDecimal totalVentas = BigDecimal.ZERO, totalMeta = BigDecimal.ZERO;
            int totalBajoMin = 0, rank = 1;
            boolean alt = false;
            for (ReporteDashboard d : filas) {
                Row row = hoja.createRow(r++);
                CellStyle st = alt ? txtAlt : txt;
                celdaXls(row, 0, String.valueOf(rank++), st);
                celdaXls(row, 1, nombres.getOrDefault(d.sucursalId, "Sucursal " + d.sucursalId), st);
                celdaXls(row, 2, clp(d.totalVentas), st);
                celdaXls(row, 3, clp(d.metaMensual), st);
                celdaXls(row, 4, pct(d.porcentajeCumplimiento), st);
                celdaXls(row, 5, String.valueOf(nz(d.productosBajoMinimo)), st);
                totalVentas = totalVentas.add(nz(d.totalVentas));
                totalMeta = totalMeta.add(nz(d.metaMensual));
                totalBajoMin += nz(d.productosBajoMinimo);
                alt = !alt;
            }
            BigDecimal cumplGlobal = totalMeta.signum() > 0
                    ? totalVentas.multiply(BigDecimal.valueOf(100)).divide(totalMeta, 1, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            Row rtot = hoja.createRow(r++);
            celdaXls(rtot, 0, "", total);
            celdaXls(rtot, 1, "TOTAL", total);
            celdaXls(rtot, 2, clp(totalVentas), total);
            celdaXls(rtot, 3, clp(totalMeta), total);
            celdaXls(rtot, 4, pct(cumplGlobal), total);
            celdaXls(rtot, 5, String.valueOf(totalBajoMin), total);

            // --- Hoja 2: Inventario consolidado por sucursal ---
            if (!productos.isEmpty()) {
                Sheet hojaInv = libro.createSheet("Inventario");
                hojaInv.setColumnWidth(0, 4000);
                hojaInv.setColumnWidth(1, 10000);
                hojaInv.setColumnWidth(2, 5000);
                for (int c = 3; c <= 6; c++) hojaInv.setColumnWidth(c, 4500);

                CellStyle tituloInv = estiloTitulo(libro);
                CellStyle encabInv = estiloEncabezado(libro);
                CellStyle txtInv = estiloTexto(libro, false);
                CellStyle txtAltInv = estiloTexto(libro, true);
                CellStyle totalInv = estiloTotal(libro);
                CellStyle subtituloInv = estiloTotal(libro);

                int ri = 0;
                Row rtInv = hojaInv.createRow(ri++);
                rtInv.createCell(0).setCellValue("Inventario Consolidado — Todas las Sucursales");
                rtInv.getCell(0).setCellStyle(tituloInv);
                hojaInv.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 6));
                ri++;

                String[] colsInv = {"Código", "Producto", "Categoría", "Stock", "Mínimo", "Precio", "Valorizado"};

                Map<Long, List<ProductoDto>> porSucursal = productos.stream()
                        .collect(Collectors.groupingBy(
                                p -> p.sucursalId == null ? -1L : p.sucursalId,
                                LinkedHashMap::new, Collectors.toList()));

                int totStock = 0;
                BigDecimal totValorizado = BigDecimal.ZERO;

                for (Map.Entry<Long, List<ProductoDto>> grupo : porSucursal.entrySet()) {
                    List<ProductoDto> items = grupo.getValue();
                    String nombreSuc = items.isEmpty() || items.get(0).sucursalNombre == null
                            ? "Sucursal " + grupo.getKey()
                            : items.get(0).sucursalNombre;

                    Row rsuc = hojaInv.createRow(ri++);
                    celdaXls(rsuc, 0, nombreSuc, subtituloInv);
                    for (int c = 1; c <= 6; c++) celdaXls(rsuc, c, "", subtituloInv);

                    Row rhInv = hojaInv.createRow(ri++);
                    for (int c = 0; c < colsInv.length; c++) celdaXls(rhInv, c, colsInv[c], encabInv);

                    int grpStock = 0;
                    BigDecimal grpValorizado = BigDecimal.ZERO;
                    boolean altInv = false;
                    for (ProductoDto p : items) {
                        Row row = hojaInv.createRow(ri++);
                        escribirFilaProducto(row, p, altInv ? txtAltInv : txtInv);
                        grpStock += nz(p.stock);
                        grpValorizado = grpValorizado.add(valorizado(p));
                        altInv = !altInv;
                    }
                    Row rgt = hojaInv.createRow(ri++);
                    celdaXls(rgt, 0, "", totalInv);
                    celdaXls(rgt, 1, "Subtotal " + nombreSuc, totalInv);
                    celdaXls(rgt, 2, "", totalInv);
                    celdaXls(rgt, 3, num(grpStock), totalInv);
                    celdaXls(rgt, 4, "", totalInv);
                    celdaXls(rgt, 5, "", totalInv);
                    celdaXls(rgt, 6, clp(grpValorizado), totalInv);
                    ri++;

                    totStock += grpStock;
                    totValorizado = totValorizado.add(grpValorizado);
                }

                Row rtotInv = hojaInv.createRow(ri);
                celdaXls(rtotInv, 0, "", totalInv);
                celdaXls(rtotInv, 1, "TOTAL GENERAL", totalInv);
                celdaXls(rtotInv, 2, "", totalInv);
                celdaXls(rtotInv, 3, num(totStock), totalInv);
                celdaXls(rtotInv, 4, "", totalInv);
                celdaXls(rtotInv, 5, "", totalInv);
                celdaXls(rtotInv, 6, clp(totValorizado), totalInv);
            }

            libro.write(salida);
            return salida.toByteArray();
        } catch (Exception e) {
            LOG.errorf(e, "Error al generar Excel consolidado");
            throw new RuntimeException("Error al generar el reporte consolidado Excel", e);
        }
    }

    // ================================================================
    //  PDF — inventario (individual o consolidado por sucursal)
    // ================================================================
    public byte[] exportarInventarioPdf(List<ProductoDto> productos, String alcance, boolean consolidado) {
        LOG.infof("Generando PDF de inventario alcance=%s (%d productos)", alcance, productos.size());
        try (ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4.rotate(), 40, 40, 90, 60);
            PdfWriter writer = PdfWriter.getInstance(doc, salida);
            writer.setPageEvent(new PieDePagina());
            doc.open();

            encabezado(doc, "Reporte de Inventario");
            subtituloAlcanceInventario(doc, alcance);

            // Totales globales
            int totStock = 0;
            BigDecimal totValorizado = BigDecimal.ZERO;
            for (ProductoDto p : productos) {
                totStock += nz(p.stock);
                totValorizado = totValorizado.add(valorizado(p));
            }

            // Resumen ejecutivo (tarjetas)
            PdfPTable cards = new PdfPTable(3);
            cards.setWidthPercentage(100);
            cards.setSpacingBefore(6);
            tarjeta(cards, "Productos", String.valueOf(productos.size()), AZUL);
            tarjeta(cards, "Stock total", num(totStock), AZUL);
            tarjeta(cards, "Valorizado total", clp(totValorizado), AZUL);
            doc.add(cards);
            doc.add(espacio(12));

            if (consolidado) {
                // Agrupado por sucursal con sección/fila de totales por grupo
                Map<Long, List<ProductoDto>> porSucursal = productos.stream()
                        .collect(Collectors.groupingBy(
                                p -> p.sucursalId == null ? -1L : p.sucursalId,
                                LinkedHashMap::new, Collectors.toList()));

                for (Map.Entry<Long, List<ProductoDto>> grupo : porSucursal.entrySet()) {
                    List<ProductoDto> items = grupo.getValue();
                    String nombreSuc = items.isEmpty() || items.get(0).sucursalNombre == null
                            ? "Sucursal " + grupo.getKey()
                            : items.get(0).sucursalNombre;

                    com.lowagie.text.Paragraph titSuc = new com.lowagie.text.Paragraph(nombreSuc,
                            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, AZUL));
                    titSuc.setSpacingBefore(8);
                    titSuc.setSpacingAfter(4);
                    doc.add(titSuc);

                    doc.add(tablaInventario(items, true));
                    doc.add(espacio(4));
                }

                // Total general
                PdfPTable tg = tablaBase(new float[]{2.4f, 1.6f, 1.6f});
                celdaTotal(tg, "TOTAL GENERAL", Element.ALIGN_LEFT);
                celdaTotal(tg, "Stock: " + num(totStock), Element.ALIGN_RIGHT);
                celdaTotal(tg, "Valorizado: " + clp(totValorizado), Element.ALIGN_RIGHT);
                doc.add(espacio(6));
                doc.add(tg);
            } else {
                doc.add(tablaInventario(productos, true));
            }

            doc.close();
            return salida.toByteArray();
        } catch (Exception e) {
            LOG.errorf(e, "Error al generar PDF de inventario");
            throw new RuntimeException("Error al generar el reporte de inventario PDF", e);
        }
    }

    private PdfPTable tablaInventario(List<ProductoDto> productos, boolean conTotales) throws Exception {
        PdfPTable t = tablaBase(new float[]{1.3f, 3f, 1.8f, 1f, 1f, 1.6f, 1.8f});
        celdaEncabezado(t, "Código");
        celdaEncabezado(t, "Producto");
        celdaEncabezado(t, "Categoría");
        celdaEncabezado(t, "Stock");
        celdaEncabezado(t, "Mínimo");
        celdaEncabezado(t, "Precio");
        celdaEncabezado(t, "Valorizado");

        int totStock = 0;
        BigDecimal totValorizado = BigDecimal.ZERO;
        boolean alt = false;
        for (ProductoDto p : productos) {
            Color bg = alt ? FILA_ALT : Color.WHITE;
            Color colStock = nz(p.stock) <= nz(p.stockMinimo) ? ROJO : Color.BLACK;
            celdaTxt(t, nvl(p.codigo), bg, Element.ALIGN_LEFT, Color.BLACK);
            celdaTxt(t, nvl(p.nombre), bg, Element.ALIGN_LEFT, Color.BLACK);
            celdaTxt(t, nvl(p.categoria), bg, Element.ALIGN_LEFT, TXT_SUAVE);
            celdaTxt(t, num(nz(p.stock)), bg, Element.ALIGN_RIGHT, colStock);
            celdaTxt(t, num(nz(p.stockMinimo)), bg, Element.ALIGN_RIGHT, TXT_SUAVE);
            celdaTxt(t, clp(p.precio), bg, Element.ALIGN_RIGHT, Color.BLACK);
            celdaTxt(t, clp(valorizado(p)), bg, Element.ALIGN_RIGHT, Color.BLACK);
            totStock += nz(p.stock);
            totValorizado = totValorizado.add(valorizado(p));
            alt = !alt;
        }

        if (conTotales) {
            celdaTotal(t, "", Element.ALIGN_CENTER);
            celdaTotal(t, "TOTAL", Element.ALIGN_LEFT);
            celdaTotal(t, "", Element.ALIGN_CENTER);
            celdaTotal(t, num(totStock), Element.ALIGN_RIGHT);
            celdaTotal(t, "", Element.ALIGN_CENTER);
            celdaTotal(t, "", Element.ALIGN_CENTER);
            celdaTotal(t, clp(totValorizado), Element.ALIGN_RIGHT);
        }
        return t;
    }

    // ================================================================
    //  Excel — inventario (individual o consolidado por sucursal)
    // ================================================================
    public byte[] exportarInventarioExcel(List<ProductoDto> productos, String alcance, boolean consolidado) {
        LOG.infof("Generando Excel de inventario alcance=%s (%d productos)", alcance, productos.size());
        try (Workbook libro = new XSSFWorkbook(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            Sheet hoja = libro.createSheet("Inventario");
            hoja.setColumnWidth(0, 4000);
            hoja.setColumnWidth(1, 10000);
            hoja.setColumnWidth(2, 5000);
            for (int c = 3; c <= 6; c++) hoja.setColumnWidth(c, 4500);

            CellStyle titulo = estiloTitulo(libro);
            CellStyle encab = estiloEncabezado(libro);
            CellStyle txt = estiloTexto(libro, false);
            CellStyle txtAlt = estiloTexto(libro, true);
            CellStyle total = estiloTotal(libro);
            CellStyle subtitulo = estiloTotal(libro);

            int r = 0;
            Row rt = hoja.createRow(r++);
            rt.createCell(0).setCellValue("Reporte de Inventario · " + alcance);
            rt.getCell(0).setCellStyle(titulo);
            hoja.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 6));
            r++;

            String[] cols = {"Código", "Producto", "Categoría", "Stock", "Mínimo", "Precio", "Valorizado"};

            int totStock = 0;
            BigDecimal totValorizado = BigDecimal.ZERO;

            if (consolidado) {
                Map<Long, List<ProductoDto>> porSucursal = productos.stream()
                        .collect(Collectors.groupingBy(
                                p -> p.sucursalId == null ? -1L : p.sucursalId,
                                LinkedHashMap::new, Collectors.toList()));

                for (Map.Entry<Long, List<ProductoDto>> grupo : porSucursal.entrySet()) {
                    List<ProductoDto> items = grupo.getValue();
                    String nombreSuc = items.isEmpty() || items.get(0).sucursalNombre == null
                            ? "Sucursal " + grupo.getKey()
                            : items.get(0).sucursalNombre;

                    Row rsuc = hoja.createRow(r++);
                    celdaXls(rsuc, 0, nombreSuc, subtitulo);
                    for (int c = 1; c <= 6; c++) celdaXls(rsuc, c, "", subtitulo);

                    Row rh = hoja.createRow(r++);
                    for (int c = 0; c < cols.length; c++) celdaXls(rh, c, cols[c], encab);

                    int grpStock = 0;
                    BigDecimal grpValorizado = BigDecimal.ZERO;
                    boolean alt = false;
                    for (ProductoDto p : items) {
                        Row row = hoja.createRow(r++);
                        CellStyle st = alt ? txtAlt : txt;
                        escribirFilaProducto(row, p, st);
                        grpStock += nz(p.stock);
                        grpValorizado = grpValorizado.add(valorizado(p));
                        alt = !alt;
                    }
                    Row rgt = hoja.createRow(r++);
                    celdaXls(rgt, 0, "", total);
                    celdaXls(rgt, 1, "Subtotal " + nombreSuc, total);
                    celdaXls(rgt, 2, "", total);
                    celdaXls(rgt, 3, num(grpStock), total);
                    celdaXls(rgt, 4, "", total);
                    celdaXls(rgt, 5, "", total);
                    celdaXls(rgt, 6, clp(grpValorizado), total);
                    r++; // fila en blanco entre grupos

                    totStock += grpStock;
                    totValorizado = totValorizado.add(grpValorizado);
                }

                Row rtot = hoja.createRow(r++);
                celdaXls(rtot, 0, "", total);
                celdaXls(rtot, 1, "TOTAL GENERAL", total);
                celdaXls(rtot, 2, "", total);
                celdaXls(rtot, 3, num(totStock), total);
                celdaXls(rtot, 4, "", total);
                celdaXls(rtot, 5, "", total);
                celdaXls(rtot, 6, clp(totValorizado), total);
            } else {
                Row rh = hoja.createRow(r++);
                for (int c = 0; c < cols.length; c++) celdaXls(rh, c, cols[c], encab);

                boolean alt = false;
                for (ProductoDto p : productos) {
                    Row row = hoja.createRow(r++);
                    CellStyle st = alt ? txtAlt : txt;
                    escribirFilaProducto(row, p, st);
                    totStock += nz(p.stock);
                    totValorizado = totValorizado.add(valorizado(p));
                    alt = !alt;
                }
                Row rtot = hoja.createRow(r++);
                celdaXls(rtot, 0, "", total);
                celdaXls(rtot, 1, "TOTAL", total);
                celdaXls(rtot, 2, "", total);
                celdaXls(rtot, 3, num(totStock), total);
                celdaXls(rtot, 4, "", total);
                celdaXls(rtot, 5, "", total);
                celdaXls(rtot, 6, clp(totValorizado), total);
            }

            libro.write(salida);
            return salida.toByteArray();
        } catch (Exception e) {
            LOG.errorf(e, "Error al generar Excel de inventario");
            throw new RuntimeException("Error al generar el reporte de inventario Excel", e);
        }
    }

    private void escribirFilaProducto(Row row, ProductoDto p, CellStyle st) {
        celdaXls(row, 0, nvl(p.codigo), st);
        celdaXls(row, 1, nvl(p.nombre), st);
        celdaXls(row, 2, nvl(p.categoria), st);
        celdaXls(row, 3, num(nz(p.stock)), st);
        celdaXls(row, 4, num(nz(p.stockMinimo)), st);
        celdaXls(row, 5, clp(p.precio), st);
        celdaXls(row, 6, clp(valorizado(p)), st);
    }

    private void subtituloAlcanceInventario(Document doc, String alcance) throws Exception {
        Font fSuave = FontFactory.getFont(FontFactory.HELVETICA, 10, TXT_SUAVE);
        com.lowagie.text.Paragraph p = new com.lowagie.text.Paragraph();
        p.setFont(fSuave);
        p.add(new Phrase("Alcance: ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, TXT_SUAVE)));
        p.add(new Phrase(alcance + "    |    ", fSuave));
        p.add(new Phrase("Generado: ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, TXT_SUAVE)));
        p.add(new Phrase(LocalDateTime.now().format(FECHA_FMT), fSuave));
        p.setSpacingAfter(8);
        doc.add(p);

        // línea separadora
        PdfPTable linea = new PdfPTable(1);
        linea.setWidthPercentage(100);
        PdfPCell c = new PdfPCell();
        c.setFixedHeight(2);
        c.setBackgroundColor(AZUL_BANDA);
        c.setBorder(Rectangle.NO_BORDER);
        linea.addCell(c);
        doc.add(linea);
    }

    private BigDecimal valorizado(ProductoDto p) {
        if (p.precio == null) return BigDecimal.ZERO;
        return p.precio.multiply(BigDecimal.valueOf(nz(p.stock)));
    }

    // ================================================================
    //  Helpers PDF
    // ================================================================
    private void encabezado(Document doc, String titulo) throws Exception {
        PdfPTable barra = new PdfPTable(1);
        barra.setWidthPercentage(100);
        PdfPCell marca = new PdfPCell(new Phrase("GRUPO CORDILLERA",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE)));
        marca.setBackgroundColor(AZUL);
        marca.setBorder(Rectangle.NO_BORDER);
        marca.setPadding(8);
        marca.setPaddingLeft(12);
        barra.addCell(marca);
        doc.add(barra);

        com.lowagie.text.Paragraph h = new com.lowagie.text.Paragraph(titulo,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, AZUL));
        h.setSpacingBefore(12);
        doc.add(h);
    }

    private void subtituloAlcance(Document doc, String alcance, String periodo) throws Exception {
        Font fSuave = FontFactory.getFont(FontFactory.HELVETICA, 10, TXT_SUAVE);
        com.lowagie.text.Paragraph p = new com.lowagie.text.Paragraph();
        p.setFont(fSuave);
        p.add(new Phrase("Alcance: ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, TXT_SUAVE)));
        p.add(new Phrase(alcance + "    |    ", fSuave));
        p.add(new Phrase("Período: ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, TXT_SUAVE)));
        p.add(new Phrase(periodo + "    |    ", fSuave));
        p.add(new Phrase("Generado: ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, TXT_SUAVE)));
        p.add(new Phrase(LocalDateTime.now().format(FECHA_FMT), fSuave));
        p.setSpacingAfter(8);
        doc.add(p);

        // línea separadora
        PdfPTable linea = new PdfPTable(1);
        linea.setWidthPercentage(100);
        PdfPCell c = new PdfPCell();
        c.setFixedHeight(2);
        c.setBackgroundColor(AZUL_BANDA);
        c.setBorder(Rectangle.NO_BORDER);
        linea.addCell(c);
        doc.add(linea);
    }

    private void tarjeta(PdfPTable cont, String label, String valor, Color colorValor) {
        PdfPTable card = new PdfPTable(1);
        PdfPCell lc = new PdfPCell(new Phrase(label.toUpperCase(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, TXT_SUAVE)));
        lc.setBorder(Rectangle.NO_BORDER);
        lc.setPaddingTop(10);
        lc.setPaddingLeft(12);
        lc.setBackgroundColor(FILA_ALT);
        card.addCell(lc);
        PdfPCell vc = new PdfPCell(new Phrase(valor, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, colorValor)));
        vc.setBorder(Rectangle.NO_BORDER);
        vc.setPaddingBottom(10);
        vc.setPaddingLeft(12);
        vc.setBackgroundColor(FILA_ALT);
        card.addCell(vc);

        PdfPCell wrap = new PdfPCell(card);
        wrap.setBorderColor(BORDE);
        wrap.setBorderWidth(0.8f);
        wrap.setPadding(3);
        cont.addCell(wrap);
    }

    private PdfPTable tablaBase(float[] anchos) throws Exception {
        PdfPTable t = new PdfPTable(anchos.length);
        t.setWidthPercentage(100);
        t.setWidths(anchos);
        t.setSpacingBefore(4);
        return t;
    }

    private void celdaEncabezado(PdfPTable t, String txt) {
        PdfPCell c = new PdfPCell(new Phrase(txt, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, Color.WHITE)));
        c.setBackgroundColor(AZUL);
        c.setPadding(7);
        c.setBorderColor(AZUL);
        t.addCell(c);
    }

    private boolean filaDetalle(PdfPTable t, String etiqueta, String valor, boolean alt) {
        Color bg = alt ? FILA_ALT : Color.WHITE;
        celdaTxt(t, etiqueta, bg, Element.ALIGN_LEFT, Color.BLACK);
        celdaTxt(t, valor, bg, Element.ALIGN_RIGHT, Color.BLACK);
        return !alt;
    }

    private void celdaTxt(PdfPTable t, String txt, Color bg, int align, Color color) {
        PdfPCell c = new PdfPCell(new Phrase(txt, FontFactory.getFont(FontFactory.HELVETICA, 9.5f, color)));
        c.setBackgroundColor(bg);
        c.setHorizontalAlignment(align);
        c.setPadding(6);
        c.setBorderColor(BORDE);
        c.setBorderWidth(0.5f);
        t.addCell(c);
    }

    private void celdaTotal(PdfPTable t, String txt, int align) {
        PdfPCell c = new PdfPCell(new Phrase(txt, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, AZUL)));
        c.setBackgroundColor(new Color(225, 233, 246));
        c.setHorizontalAlignment(align);
        c.setPadding(7);
        c.setBorderColor(AZUL_BANDA);
        c.setBorderWidth(0.8f);
        t.addCell(c);
    }

    private com.lowagie.text.Paragraph espacio(float alto) {
        com.lowagie.text.Paragraph p = new com.lowagie.text.Paragraph(" ");
        p.setSpacingBefore(alto);
        return p;
    }

    // ================================================================
    //  Helpers Excel
    // ================================================================
    private CellStyle estiloTitulo(Workbook libro) {
        CellStyle s = libro.createCellStyle();
        org.apache.poi.ss.usermodel.Font f = libro.createFont();
        f.setBold(true);
        f.setFontHeightInPoints((short) 14);
        f.setColor(IndexedColors.DARK_BLUE.getIndex());
        s.setFont(f);
        return s;
    }

    private CellStyle estiloEncabezado(Workbook libro) {
        CellStyle s = libro.createCellStyle();
        org.apache.poi.ss.usermodel.Font f = libro.createFont();
        f.setBold(true);
        f.setColor(IndexedColors.WHITE.getIndex());
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.LEFT);
        bordes(s);
        return s;
    }

    private CellStyle estiloTexto(Workbook libro, boolean alterna) {
        CellStyle s = libro.createCellStyle();
        if (alterna) {
            s.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }
        bordes(s);
        return s;
    }

    private CellStyle estiloTotal(Workbook libro) {
        CellStyle s = libro.createCellStyle();
        org.apache.poi.ss.usermodel.Font f = libro.createFont();
        f.setBold(true);
        f.setColor(IndexedColors.DARK_BLUE.getIndex());
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        bordes(s);
        return s;
    }

    private void bordes(CellStyle s) {
        s.setBorderBottom(BorderStyle.THIN);
        s.setBorderTop(BorderStyle.THIN);
        s.setBorderLeft(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
        s.setBottomBorderColor(IndexedColors.GREY_40_PERCENT.getIndex());
        s.setTopBorderColor(IndexedColors.GREY_40_PERCENT.getIndex());
        s.setLeftBorderColor(IndexedColors.GREY_40_PERCENT.getIndex());
        s.setRightBorderColor(IndexedColors.GREY_40_PERCENT.getIndex());
    }

    private void celdaXls(Row row, int col, String valor, CellStyle estilo) {
        org.apache.poi.ss.usermodel.Cell c = row.createCell(col);
        c.setCellValue(valor);
        c.setCellStyle(estilo);
    }

    // ================================================================
    //  Formato de valores
    // ================================================================
    private String clp(BigDecimal monto) {
        if (monto == null) return "$0";
        NumberFormat nf = NumberFormat.getInstance(LOCALE_CL);
        nf.setMaximumFractionDigits(0);
        return "$" + nf.format(monto);
    }

    private String num(int valor) {
        return NumberFormat.getInstance(LOCALE_CL).format(valor);
    }

    private String nvl(String s) {
        return s == null ? "" : s;
    }

    private String pct(BigDecimal v) {
        if (v == null) return "0,0%";
        return String.format(LOCALE_CL, "%.1f%%", v);
    }

    private String pctSigno(BigDecimal v) {
        if (v == null) return "0,0%";
        String s = String.format(LOCALE_CL, "%.1f%%", v.abs());
        if (v.signum() > 0) return "+" + s;
        if (v.signum() < 0) return "-" + s;
        return s;
    }

    private Color colorCumplimiento(BigDecimal pct) {
        if (pct == null) return TXT_SUAVE;
        double p = pct.doubleValue();
        if (p >= 90) return VERDE;
        if (p >= 60) return AMBAR;
        return ROJO;
    }

    private Color colorVariacion(BigDecimal v) {
        if (v == null || v.signum() == 0) return TXT_SUAVE;
        return v.signum() > 0 ? VERDE : ROJO;
    }

    private BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
    private int nz(Integer v) { return v == null ? 0 : v; }

    // ================================================================
    //  Pie de página (numeración + nota)
    // ================================================================
    private static class PieDePagina extends PdfPageEventHelper {
        private final Font fpie = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(150, 158, 166));

        @Override
        public void onEndPage(PdfWriter writer, Document doc) {
            PdfPTable pie = new PdfPTable(2);
            try {
                pie.setWidths(new int[]{6, 1});
                pie.setTotalWidth(doc.getPageSize().getWidth() - doc.leftMargin() - doc.rightMargin());
                PdfPCell izq = new PdfPCell(new Phrase(
                        "Grupo Cordillera · Documento generado automáticamente · Confidencial", fpie));
                izq.setBorder(Rectangle.TOP);
                izq.setBorderColor(new Color(214, 220, 228));
                izq.setPaddingTop(6);
                PdfPCell der = new PdfPCell(new Phrase("Pág. " + writer.getPageNumber(), fpie));
                der.setBorder(Rectangle.TOP);
                der.setBorderColor(new Color(214, 220, 228));
                der.setHorizontalAlignment(Element.ALIGN_RIGHT);
                der.setPaddingTop(6);
                pie.addCell(izq);
                pie.addCell(der);
                pie.writeSelectedRows(0, -1, doc.leftMargin(), doc.bottomMargin() - 4, writer.getDirectContent());
            } catch (Exception ignored) {
            }
        }
    }
}
