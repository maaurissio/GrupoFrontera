package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.ReporteGeneradoClient;
import com.grupofrontera.bff.dto.FavoritoDTO;
import com.grupofrontera.bff.dto.ReporteGeneradoDTO;
import jakarta.inject.Inject;
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
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/reportes-guardados")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReporteGeneradoResource {

    @Inject
    @RestClient
    ReporteGeneradoClient reporteGeneradoClient;

    @GET
    public List<ReporteGeneradoDTO> listar() {
        return reporteGeneradoClient.listar();
    }

    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Long id) {
        return reporteGeneradoClient.eliminar(id);
    }

    @PUT
    @Path("/{id}/favorito")
    public ReporteGeneradoDTO marcarFavorito(@PathParam("id") Long id, FavoritoDTO request) {
        return reporteGeneradoClient.marcarFavorito(id, request);
    }
}
