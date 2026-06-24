package com.grupofrontera.msdatos.api.resource;

import com.grupofrontera.msdatos.api.dto.EstadoRequest;
import com.grupofrontera.msdatos.api.dto.SucursalRequest;
import com.grupofrontera.msdatos.api.dto.SucursalResponse;
import com.grupofrontera.msdatos.domain.entity.Sucursal;
import com.grupofrontera.msdatos.domain.service.SucursalService;
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

@Path("/api/v1/sucursales")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SucursalResource {

    @Inject
    SucursalService sucursalService;

    @POST
    public Response crear(@Valid SucursalRequest request) {
        if (sucursalService.buscarPorCodigo(request.codigo).isPresent()) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("Ya existe una sucursal con el código: " + request.codigo)
                    .build();
        }

        Sucursal sucursal = new Sucursal();
        sucursal.codigo = request.codigo;
        sucursal.nombre = request.nombre;
        sucursal.ciudad = request.ciudad;
        sucursal.ciudadId = request.ciudadId;
        sucursal.latitud = request.latitud;
        sucursal.longitud = request.longitud;
        sucursal.direccion = request.direccion;
        sucursal.anioApertura = request.anioApertura;

        Sucursal creada = sucursalService.crear(sucursal);
        return Response.status(Response.Status.CREATED)
                .entity(SucursalResponse.fromEntity(creada))
                .build();
    }

    @GET
    public List<SucursalResponse> listar() {
        return sucursalService.listarTodas()
                .stream()
                .map(SucursalResponse::fromEntity)
                .toList();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return sucursalService.buscarPorId(id)
                .map(s -> Response.ok(SucursalResponse.fromEntity(s)))
                .orElse(Response.status(Response.Status.NOT_FOUND))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Long id, @Valid SucursalRequest request) {
        try {
            Sucursal datos = new Sucursal();
            datos.codigo = request.codigo;
            datos.nombre = request.nombre;
            datos.ciudad = request.ciudad;
            datos.ciudadId = request.ciudadId;
            datos.latitud = request.latitud;
            datos.longitud = request.longitud;
            datos.direccion = request.direccion;
            datos.anioApertura = request.anioApertura;

            Sucursal actualizada = sucursalService.actualizar(id, datos);
            return Response.ok(SucursalResponse.fromEntity(actualizada)).build();
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
            Sucursal actualizada = sucursalService.cambiarEstado(id, request.activo);
            return Response.ok(SucursalResponse.fromEntity(actualizada)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(e.getMessage())
                    .build();
        }
    }
}
