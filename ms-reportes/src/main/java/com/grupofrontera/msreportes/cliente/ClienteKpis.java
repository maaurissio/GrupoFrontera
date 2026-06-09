package com.grupofrontera.msreportes.cliente;

import com.grupofrontera.msreportes.dto.RespuestaKpisDto;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.List;

@RegisterRestClient(configKey = "kpis-api")
@Path("/kpis")
@Produces(MediaType.APPLICATION_JSON)
public interface ClienteKpis {

    @GET
    RespuestaKpisDto obtenerKpis(
            @QueryParam("sucursalId") Long sucursalId,
            @QueryParam("periodo") String periodo);

    @GET
    @Path("/comparativo")
    List<RespuestaKpisDto> obtenerComparativo(@QueryParam("periodo") String periodo);
}
