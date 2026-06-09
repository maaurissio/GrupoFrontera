package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.AuthClient;
import com.grupofrontera.bff.client.UsersClient;
import com.grupofrontera.bff.dto.UsuarioCreateRequest;
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
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioResource {

    @Inject
    @RestClient
    UsersClient usersClient;

    @Inject
    @RestClient
    AuthClient authClient;

    @GET
    public List<Object> listar() {
        return usersClient.listarUsuarios();
    }

    @GET
    @Path("/{id}")
    public Object obtener(@PathParam("id") UUID id) {
        return usersClient.obtenerUsuario(id);
    }

    @POST
    public Response crear(@Valid UsuarioCreateRequest request) {
        var usuarioPayload = Map.of(
            "rut", request.rut,
            "dv", request.dv != null ? request.dv : "",
            "nombre", request.nombre,
            "apellido", request.apellido,
            "email", request.email,
            "telefono", request.telefono != null ? request.telefono : "",
            "fechaNacimiento", request.fechaNacimiento != null ? request.fechaNacimiento.toString() : null
        );

        Response usersResponse = usersClient.crearUsuario(usuarioPayload);
        if (usersResponse.getStatus() != 201) {
            return usersResponse;
        }

        Object usuarioCreado = usersResponse.getEntity();
        @SuppressWarnings("unchecked")
        Map<String, Object> usuarioMap = (Map<String, Object>) usuarioCreado;
        UUID usuarioId = UUID.fromString(usuarioMap.get("id").toString());

        var authPayload = Map.of(
            "usuarioId", usuarioId.toString(),
            "email", request.email,
            "password", request.password
        );

        return authClient.register(authPayload);
    }

    @PUT
    @Path("/{id}/activar")
    public Response activar(@PathParam("id") UUID id) {
        return usersClient.activarUsuario(id);
    }

    @PUT
    @Path("/{id}/desactivar")
    public Response desactivar(@PathParam("id") UUID id) {
        return usersClient.desactivarUsuario(id);
    }

    @POST
    @Path("/{usuarioId}/roles")
    public Response asignarRol(@PathParam("usuarioId") UUID usuarioId, Map<String, UUID> body) {
        return usersClient.asignarRol(usuarioId, body);
    }

    @GET
    @Path("/{usuarioId}/sucursales")
    public List<Object> listarSucursales(@PathParam("usuarioId") UUID usuarioId) {
        return usersClient.listarSucursalesPorUsuario(usuarioId);
    }

    @POST
    @Path("/{usuarioId}/sucursales")
    public Response asignarSucursal(@PathParam("usuarioId") UUID usuarioId, Map<String, UUID> body) {
        return usersClient.asignarSucursal(usuarioId, body);
    }
}
