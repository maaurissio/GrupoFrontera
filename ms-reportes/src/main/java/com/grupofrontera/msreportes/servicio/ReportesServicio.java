package com.grupofrontera.msreportes.servicio;

import com.grupofrontera.msreportes.cliente.ClienteDatos;
import com.grupofrontera.msreportes.cliente.ClienteKpis;
import com.grupofrontera.msreportes.dto.ReporteDashboard;
import com.grupofrontera.msreportes.dto.RespuestaKpisDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
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
