package com.grupofrontera.msreportes.cliente;

import com.grupofrontera.msreportes.dto.SucursalDto;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.List;

@RegisterRestClient(configKey = "datos-api")
@Path("/api/v1")
@Produces(MediaType.APPLICATION_JSON)
public interface ClienteDatos {

    @GET
    @Path("/sucursales")
    List<SucursalDto> listarSucursales();
}
