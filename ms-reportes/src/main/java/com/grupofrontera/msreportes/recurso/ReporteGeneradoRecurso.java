package com.grupofrontera.msreportes.recurso;

import com.grupofrontera.msreportes.dto.FavoritoRequest;
import com.grupofrontera.msreportes.dto.ReporteGeneradoDto;
import com.grupofrontera.msreportes.servicio.ReporteGeneradoService;
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

@Path("/reportes-guardados")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReporteGeneradoRecurso {

    @Inject
    ReporteGeneradoService service;

    @GET
    public List<ReporteGeneradoDto> listar() {
        return service.listar().stream().map(ReporteGeneradoDto::fromEntity).toList();
    }

    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Long id) {
        service.eliminar(id);
        return Response.noContent().build();
    }

    @PUT
    @Path("/{id}/favorito")
    public ReporteGeneradoDto marcarFavorito(@PathParam("id") Long id, FavoritoRequest request) {
        boolean favorito = request != null && Boolean.TRUE.equals(request.favorito);
        return ReporteGeneradoDto.fromEntity(service.marcarFavorito(id, favorito));
    }
}
