package com.grupofrontera.msreportes.servicio;

import com.grupofrontera.msreportes.dto.ProductoDto;
import com.grupofrontera.msreportes.dto.ReporteDashboard;
import com.grupofrontera.msreportes.dto.VentaDto;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExportacionServicioTest {

    private ExportacionServicio servicio;
    private ReporteDashboard dashboard;

    @BeforeEach
    void setUp() {
        servicio = new ExportacionServicio();

        dashboard = new ReporteDashboard();
        dashboard.sucursalId = 1L;
        dashboard.periodo = "2026-06";
        dashboard.totalVentas = new BigDecimal("500000");
        dashboard.metaMensual = new BigDecimal("600000");
        dashboard.porcentajeCumplimiento = new BigDecimal("83.33");
        dashboard.productosBajoMinimo = 2;
        dashboard.disponibilidadSistema = true;
        dashboard.variacionPeriodoAnterior = new BigDecimal("12.5");
    }

    private ProductoDto producto(Long id, String codigo, Long sucursalId, String sucursalNombre,
                                 int stock, int stockMinimo, String precio) {
        ProductoDto p = new ProductoDto();
        p.id = id;
        p.codigo = codigo;
        p.nombre = "Producto " + codigo;
        p.sucursalId = sucursalId;
        p.sucursalNombre = sucursalNombre;
        p.categoria = "TV";
        p.stock = stock;
        p.stockMinimo = stockMinimo;
        p.precio = new BigDecimal(precio);
        return p;
    }

    private VentaDto venta(Long sucursalId, String fechaHora, String canal, String monto) {
        VentaDto v = new VentaDto();
        v.sucursalRefId = sucursalId;
        v.fechaHora = LocalDateTime.parse(fechaHora);
        v.canal = canal;
        v.montoTotal = new BigDecimal(monto);
        return v;
    }

    private boolean esPdf(byte[] bytes) {
        return bytes != null && bytes.length > 4
                && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
    }

    private Workbook abrir(byte[] bytes) throws Exception {
        return new XSSFWorkbook(new ByteArrayInputStream(bytes));
    }

    @Test
    void exportarPdf_conProductos_generaPdfValido() {
        List<ProductoDto> productos = List.of(
                producto(1L, "P-001", 1L, "Sucursal Uno", 10, 5, "1000"),
                producto(2L, "P-002", 1L, "Sucursal Uno", 3, 5, "2000"));

        byte[] pdf = servicio.exportarPdf(dashboard, "Sucursal Uno", productos, List.of());

        assertTrue(esPdf(pdf), "Debe comenzar con la firma %PDF");
        assertTrue(pdf.length > 500);
    }

    @Test
    void exportarExcel_conProductos_tieneDosHojas() throws Exception {
        List<ProductoDto> productos = List.of(
                producto(1L, "P-001", 1L, "Sucursal Uno", 10, 5, "1000"));

        byte[] xlsx = servicio.exportarExcel(dashboard, "Sucursal Uno", productos, List.of());

        try (Workbook libro = abrir(xlsx)) {
            assertNotNull(libro.getSheet("KPIs"));
            assertNotNull(libro.getSheet("Inventario"));
        }
    }

    @Test
    void exportarExcel_conVentas_agregaHojaTransaccionesConTotal() throws Exception {
        List<ProductoDto> productos = List.of();
        List<VentaDto> ventas = List.of(
                venta(1L, "2026-06-10T10:30:00", "TIENDA", "15000"),
                venta(1L, "2026-06-11T16:45:00", "ONLINE", "25000"));

        byte[] xlsx = servicio.exportarExcel(dashboard, "Sucursal Uno", productos, ventas);

        try (Workbook libro = abrir(xlsx)) {
            Sheet hoja = libro.getSheet("Transacciones");
            assertNotNull(hoja);
            assertTrue(contieneTexto(hoja, "TOTAL (2)"));
        }
    }

    @Test
    void exportarInventarioExcel_consolidado_tieneSubtotalesYTotalGeneral() throws Exception {
        List<ProductoDto> productos = List.of(
                producto(1L, "P-001", 1L, "Sucursal Uno", 10, 5, "1000"),
                producto(2L, "P-002", 2L, "Sucursal Dos", 4, 5, "2000"));

        byte[] xlsx = servicio.exportarInventarioExcel(productos, "Todas las sucursales", true);

        try (Workbook libro = abrir(xlsx)) {
            Sheet hoja = libro.getSheet("Inventario");
            assertNotNull(hoja);
            assertTrue(contieneTexto(hoja, "Subtotal Sucursal Uno"));
            assertTrue(contieneTexto(hoja, "Subtotal Sucursal Dos"));
            assertTrue(contieneTexto(hoja, "TOTAL GENERAL"));
        }
    }

    private boolean contieneTexto(Sheet hoja, String esperado) {
        for (org.apache.poi.ss.usermodel.Row fila : hoja) {
            for (org.apache.poi.ss.usermodel.Cell celda : fila) {
                if (celda.getCellType() == org.apache.poi.ss.usermodel.CellType.STRING
                        && celda.getStringCellValue().contains(esperado)) {
                    return true;
                }
            }
        }
        return false;
    }
}
