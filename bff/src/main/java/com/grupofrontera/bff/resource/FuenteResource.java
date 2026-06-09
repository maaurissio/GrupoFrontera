package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.DatosClient;
import com.grupofrontera.bff.dto.EstadoDTO;
import com.grupofrontera.bff.dto.FuenteDTO;
import com.grupofrontera.bff.dto.FuenteRequestDTO;
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
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/fuentes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FuenteResource {

    @Inject
    @RestClient
    DatosClient datosClient;

    @POST
    public Response crear(@Valid FuenteRequestDTO request) {
        return datosClient.crearFuente(request);
    }

    @GET
    public List<FuenteDTO> listar() {
        return datosClient.listarFuentes();
    }

    @GET
    @Path("/{id}")
    public FuenteDTO obtener(@PathParam("id") Long id) {
        return datosClient.obtenerFuente(id);
    }

    @PUT
    @Path("/{id}")
    public FuenteDTO actualizar(@PathParam("id") Long id, @Valid FuenteRequestDTO request) {
        return datosClient.actualizarFuente(id, request);
    }

    @PUT
    @Path("/{id}/estado")
    public FuenteDTO cambiarEstado(@PathParam("id") Long id, @Valid EstadoDTO request) {
        return datosClient.cambiarEstadoFuente(id, request);
    }
}
