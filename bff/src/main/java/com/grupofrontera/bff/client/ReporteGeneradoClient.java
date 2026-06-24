package com.grupofrontera.bff.client;

import com.grupofrontera.bff.dto.FavoritoDTO;
import com.grupofrontera.bff.dto.ReporteGeneradoDTO;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "ms-reportes")
@Path("/reportes-guardados")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface ReporteGeneradoClient {

    @GET
    List<ReporteGeneradoDTO> listar();

    @DELETE
    @Path("/{id}")
    Response eliminar(@PathParam("id") Long id);

    @PUT
    @Path("/{id}/favorito")
    ReporteGeneradoDTO marcarFavorito(@PathParam("id") Long id, FavoritoDTO request);
}
