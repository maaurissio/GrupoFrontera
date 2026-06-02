package com.grupofrontera.msdatos.api.resource;

import com.grupofrontera.msdatos.api.dto.EstadoRequest;
import com.grupofrontera.msdatos.api.dto.FuenteRequest;
import com.grupofrontera.msdatos.api.dto.FuenteResponse;
import com.grupofrontera.msdatos.domain.entity.Fuente;
import com.grupofrontera.msdatos.domain.service.FuenteService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/fuentes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FuenteResource {

    @Inject
    FuenteService fuenteService;

    @POST
    public Response crear(@Valid FuenteRequest request) {
        if (fuenteService.buscarPorCodigo(request.codigo).isPresent()) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("Ya existe una fuente con el código: " + request.codigo)
                    .build();
        }

        Fuente fuente = new Fuente();
        fuente.codigo = request.codigo;
        fuente.nombre = request.nombre;
        fuente.descripcion = request.descripcion;

        Fuente creada = fuenteService.crear(fuente);
        return Response.status(Response.Status.CREATED)
                .entity(FuenteResponse.fromEntity(creada))
                .build();
    }

    @GET
    public List<FuenteResponse> listar() {
        return fuenteService.listarTodas()
                .stream()
                .map(FuenteResponse::fromEntity)
                .toList();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return fuenteService.buscarPorId(id)
                .map(f -> Response.ok(FuenteResponse.fromEntity(f)))
                .orElse(Response.status(Response.Status.NOT_FOUND))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Long id, @Valid FuenteRequest request) {
        try {
            Fuente datos = new Fuente();
            datos.codigo = request.codigo;
            datos.nombre = request.nombre;
            datos.descripcion = request.descripcion;

            Fuente actualizada = fuenteService.actualizar(id, datos);
            return Response.ok(FuenteResponse.fromEntity(actualizada)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(e.getMessage())
                    .build();
        }
    }

    @PUT
    @Path("/{id}/estado")
    public Response cambiarEstado(@PathParam("id") Long id, @Valid EstadoRequest request) {
        try {
            Fuente actualizada = fuenteService.cambiarEstado(id, request.activo);
            return Response.ok(FuenteResponse.fromEntity(actualizada)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(e.getMessage())
                    .build();
        }
    }
}
