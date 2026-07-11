package com.grupofrontera.msreportes.servicio;

import com.grupofrontera.msreportes.cliente.ClienteDatos;
import com.grupofrontera.msreportes.cliente.ClienteKpis;
import com.grupofrontera.msreportes.cliente.ClienteVentas;
import com.grupofrontera.msreportes.dto.ProductoDto;
import com.grupofrontera.msreportes.dto.ReporteDashboard;
import com.grupofrontera.msreportes.dto.RespuestaKpisDto;
import com.grupofrontera.msreportes.dto.VentaDto;
import com.grupofrontera.msreportes.dto.VentaPaginaDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class ReportesServicio {

    private static final Logger LOG = Logger.getLogger(ReportesServicio.class);
    private static final DateTimeFormatter FORMATO_PERIODO = DateTimeFormatter.ofPattern("yyyy-MM");

    @Inject
    @RestClient
    ClienteKpis clienteKpis;

    @Inject
    @RestClient
    ClienteDatos clienteDatos;

    @Inject
    @RestClient
    ClienteVentas clienteVentas;

    // Suficiente para cubrir el volumen de un solo mes (~500 x sucursal, ~2000 consolidado).
    private static final int VENTAS_PAGE_SIZE = 5000;

    /**
     * Mapa sucursalId → nombre. Si ms-datos no responde, devuelve mapa vacío
     * (los reportes caen a "Sucursal {id}" en vez de fallar).
     */
    public Map<Long, String> obtenerNombresSucursales() {
        try {
            return clienteDatos.listarSucursales().stream()
                    .filter(s -> s.id != null && s.nombre != null)
                    .collect(Collectors.toMap(s -> s.id, s -> s.nombre, (a, b) -> a));
        } catch (Exception e) {
            LOG.warnf("No se pudieron obtener nombres de sucursal desde ms-datos: %s", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Trae los productos (filtrados por sucursal o todos) para el reporte de inventario.
     * Enriquce cada producto con el nombre de su sucursal (vía obtenerNombresSucursales)
     * para permitir agrupar por sucursal en el consolidado.
     * Lanza 404 (NotFoundException) si no hay productos.
     */
    public List<ProductoDto> obtenerInventario(Long sucursalId) {
        LOG.infof("Consultando inventario: sucursalId=%s", sucursalId);
        List<ProductoDto> productos = clienteDatos.listarProductos(sucursalId);

        if (productos == null || productos.isEmpty()) {
            String alcance = sucursalId != null ? "la sucursal " + sucursalId : "ninguna sucursal";
            throw new NotFoundException("No hay productos para " + alcance);
        }

        Map<Long, String> nombres = obtenerNombresSucursales();
        for (ProductoDto p : productos) {
            if (p.sucursalNombre == null || p.sucursalNombre.isBlank()) {
                p.sucursalNombre = nombres.getOrDefault(p.sucursalId, "Sucursal " + p.sucursalId);
            }
        }
        return productos;
    }

    /**
     * Trae el resumen de transacciones (boletas) del periodo, opcionalmente filtrado
     * por sucursal. Si ms-kpis no responde, devuelve lista vacía (el informe continúa
     * sin esta sección, igual que con el inventario).
     */
    public List<VentaDto> obtenerVentas(Long sucursalId, String periodo) {
        try {
            VentaPaginaDto pagina = clienteVentas.listar(sucursalId, periodo, periodo, 0, VENTAS_PAGE_SIZE);
            return pagina != null && pagina.content != null ? pagina.content : List.of();
        } catch (Exception e) {
            LOG.warnf("No se pudieron obtener transacciones para sucursalId=%s periodo=%s: %s",
                    sucursalId, periodo, e.getMessage());
            return List.of();
        }
    }

    public ReporteDashboard obtenerDashboard(Long sucursalId, String periodo) {
        LOG.infof("Consultando dashboard: sucursalId=%d, periodo=%s", sucursalId, periodo);
        try {
            RespuestaKpisDto kpis = clienteKpis.obtenerKpis(sucursalId, periodo);
            return construirDashboard(kpis, calcularVariacion(sucursalId, periodo));
        } catch (WebApplicationException e) {
            throw new WebApplicationException(
                Response.status(e.getResponse().getStatus())
                    .entity("{\"error\": \"No hay KPIs para sucursal " + sucursalId + " en periodo " + periodo + "\"}")
                    .type("application/json")
                    .build()
            );
        }
    }

    public List<ReporteDashboard> obtenerComparativo(String periodo) {
        LOG.infof("Consultando comparativo para periodo=%s", periodo);
        List<RespuestaKpisDto> listaKpis = clienteKpis.obtenerComparativo(periodo);

        return listaKpis.stream()
                .map(kpis -> construirDashboard(kpis, calcularVariacion(kpis.sucursalId, periodo)))
                .sorted(Comparator.comparing((ReporteDashboard d) -> d.totalVentas, Comparator.reverseOrder()))
                .toList();
    }

    private ReporteDashboard construirDashboard(RespuestaKpisDto kpis, BigDecimal variacion) {
        ReporteDashboard dashboard = new ReporteDashboard();
        dashboard.sucursalId = kpis.sucursalId;
        dashboard.periodo = kpis.periodo;
        dashboard.totalVentas = kpis.totalVentas;
        dashboard.metaMensual = kpis.metaMensual;
        dashboard.porcentajeCumplimiento = kpis.porcentajeCumplimiento;
        dashboard.productosBajoMinimo = kpis.productosBajoMinimo != null ? kpis.productosBajoMinimo : 0;
        dashboard.disponibilidadSistema = true;
        dashboard.variacionPeriodoAnterior = variacion;
        return dashboard;
    }

    private BigDecimal calcularVariacion(Long sucursalId, String periodo) {
        try {
            String periodoAnterior = LocalDate.parse(periodo + "-01", DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                    .minusMonths(1)
                    .format(FORMATO_PERIODO);

            RespuestaKpisDto kpisAnterior = clienteKpis.obtenerKpis(sucursalId, periodoAnterior);
            if (kpisAnterior.totalVentas != null && kpisAnterior.totalVentas.compareTo(BigDecimal.ZERO) > 0) {
                RespuestaKpisDto kpisActual = clienteKpis.obtenerKpis(sucursalId, periodo);
                return kpisActual.totalVentas
                        .subtract(kpisAnterior.totalVentas)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(kpisAnterior.totalVentas, 2, RoundingMode.HALF_UP);
            }
        } catch (WebApplicationException e) {
            if (e.getResponse().getStatus() != Response.Status.NOT_FOUND.getStatusCode()) {
                LOG.warnf("No se pudo calcular variacion para sucursal=%d: %s", sucursalId, e.getMessage());
            }
        }
        return BigDecimal.ZERO;
    }
}
