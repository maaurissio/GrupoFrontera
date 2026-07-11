package com.grupofrontera.mskpis.servicio;

import com.grupofrontera.mskpis.dto.VentaDetalleDTO;
import com.grupofrontera.mskpis.dto.VentaItemDTO;
import com.grupofrontera.mskpis.dto.VentaPaginaDTO;
import com.grupofrontera.mskpis.dto.VentaResumenDTO;
import com.grupofrontera.mskpis.entidad.Venta;
import com.grupofrontera.mskpis.entidad.VentaItem;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotFoundException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class VentaServicio {

    public VentaPaginaDTO listar(Long sucursalId, String periodoDesde, String periodoHasta, int page, int size) {
        StringBuilder query = new StringBuilder("periodo >= :desde and periodo <= :hasta");
        Map<String, Object> params = new HashMap<>();
        params.put("desde", periodoDesde);
        params.put("hasta", periodoHasta);
        if (sucursalId != null) {
            query.append(" and sucursalRefId = :sucursalId");
            params.put("sucursalId", sucursalId);
        }

        PanacheQuery<Venta> panacheQuery = Venta
                .find(query.toString(), Sort.descending("fechaHora"), params)
                .page(Page.of(page, size));

        List<Venta> ventas = panacheQuery.list();
        long total = panacheQuery.count();
        int totalPages = panacheQuery.pageCount();

        Map<Long, Long> conteoItems = contarItemsPorVenta(ventas.stream().map(v -> v.id).toList());

        List<VentaResumenDTO> content = ventas.stream()
                .map(v -> VentaResumenDTO.desde(v, conteoItems.getOrDefault(v.id, 0L)))
                .toList();

        VentaPaginaDTO dto = new VentaPaginaDTO();
        dto.content = content;
        dto.totalElements = total;
        dto.totalPages = totalPages;
        dto.page = page;
        dto.size = size;
        return dto;
    }

    public VentaDetalleDTO obtenerDetalle(Long id) {
        Venta venta = Venta.buscarPorId(id)
                .orElseThrow(() -> new NotFoundException("No existe la venta " + id));

        List<VentaItemDTO> items = VentaItem.listarPorVenta(id).stream()
                .map(VentaItemDTO::desde)
                .toList();

        return VentaDetalleDTO.desde(venta, items);
    }

    private Map<Long, Long> contarItemsPorVenta(List<Long> ventaIds) {
        if (ventaIds.isEmpty()) {
            return Map.of();
        }
        List<Object[]> filas = VentaItem.getEntityManager()
                .createQuery(
                        "select i.ventaId, count(i) from VentaItem i where i.ventaId in :ids group by i.ventaId",
                        Object[].class)
                .setParameter("ids", ventaIds)
                .getResultList();
        return filas.stream().collect(Collectors.toMap(f -> (Long) f[0], f -> (Long) f[1]));
    }
}
