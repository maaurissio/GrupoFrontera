package com.grupofrontera.mskpis.recurso;

import com.grupofrontera.mskpis.dto.VentaDetalleDTO;
import com.grupofrontera.mskpis.dto.VentaPaginaDTO;
import com.grupofrontera.mskpis.servicio.VentaServicio;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/ventas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class VentaRecurso {

    @Inject
    VentaServicio ventaServicio;

    @GET
    public Response listar(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodoDesde") String periodoDesde,
            @QueryParam("periodoHasta") String periodoHasta,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {

        if (periodoDesde == null || periodoDesde.isBlank() || periodoHasta == null || periodoHasta.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Los parametros periodoDesde y periodoHasta son obligatorios\"}")
                    .build();
        }

        VentaPaginaDTO pagina = ventaServicio.listar(sucursalId, periodoDesde, periodoHasta, page, size);
        return Response.ok(pagina).build();
    }

    @GET
    @Path("/{id}")
    public Response obtenerDetalle(@PathParam("id") Long id) {
        VentaDetalleDTO detalle = ventaServicio.obtenerDetalle(id);
        return Response.ok(detalle).build();
    }
}
