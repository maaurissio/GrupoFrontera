package com.grupofrontera.mskpis.recurso;

import com.grupofrontera.mskpis.dto.ActualizarKpisRequest;
import com.grupofrontera.mskpis.dto.RespuestaKpis;
import com.grupofrontera.mskpis.entidad.IndicadorInventario;
import com.grupofrontera.mskpis.entidad.IndicadorVentas;
import com.grupofrontera.mskpis.servicio.KpisServicio;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Optional;

@Path("/kpis")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class KpisRecurso {

    @Inject
    KpisServicio kpisServicio;

    @GET
    public Response obtenerKpis(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodo") String periodo) {

        if (sucursalId == null || periodo == null || periodo.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Los parametros sucursalId y periodo son obligatorios\"}")
                    .build();
        }

        Optional<IndicadorVentas> ventas = IndicadorVentas.buscarPorSucursalYPeriodo(sucursalId, periodo);
        if (ventas.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"No hay datos de KPIs para la sucursal " + sucursalId + " en el periodo " + periodo + "\"}")
                    .build();
        }

        Optional<IndicadorInventario> inventario = IndicadorInventario.buscarPorSucursalYPeriodo(sucursalId, periodo);
        RespuestaKpis respuesta = RespuestaKpis.desde(ventas.get(), inventario.orElse(null));

        return Response.ok(respuesta).build();
    }

    @PUT
    public Response actualizar(ActualizarKpisRequest request) {
        RespuestaKpis updated = kpisServicio.actualizar(request);
        return Response.ok(updated).build();
    }

    @GET
    @Path("/comparativo")
    public Response obtenerComparativo(@QueryParam("periodo") String periodo) {
        if (periodo == null || periodo.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"El parametro periodo es obligatorio\"}")
                    .build();
        }

        List<IndicadorVentas> listaVentas = IndicadorVentas.list("periodo", periodo);
        if (listaVentas.isEmpty()) {
            return Response.ok(List.of()).build();
        }

        List<RespuestaKpis> comparativo = listaVentas.stream().map(ventas -> {
            Optional<IndicadorInventario> inventario =
                    IndicadorInventario.buscarPorSucursalYPeriodo(ventas.sucursalRefId, periodo);
            return RespuestaKpis.desde(ventas, inventario.orElse(null));
        }).toList();

        return Response.ok(comparativo).build();
    }
}
