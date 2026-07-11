package com.grupofrontera.msreportes.cliente;

import com.grupofrontera.msreportes.dto.VentaPaginaDto;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "kpis-api")
@Path("/ventas")
@Produces(MediaType.APPLICATION_JSON)
public interface ClienteVentas {

    @GET
    VentaPaginaDto listar(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodoDesde") String periodoDesde,
            @QueryParam("periodoHasta") String periodoHasta,
            @QueryParam("page") int page,
            @QueryParam("size") int size);
}
