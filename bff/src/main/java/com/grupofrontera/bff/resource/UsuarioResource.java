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
import java.util.HashMap;
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
    @Path("/todos")
    public List<Object> listarTodos() {
        return usersClient.listarTodosUsuarios();
    }

    @GET
    @Path("/{id}")
    public Object obtener(@PathParam("id") UUID id) {
        return usersClient.obtenerUsuario(id);
    }

    @POST
    public Response crear(@Valid UsuarioCreateRequest request) {
        // HashMap (no Map.of) porque permite valores null: fechaNacimiento es opcional.
        Map<String, Object> usuarioPayload = new HashMap<>();
        usuarioPayload.put("rut", request.rut);
        usuarioPayload.put("dv", request.dv != null ? request.dv : "");
        usuarioPayload.put("nombre", request.nombre);
        usuarioPayload.put("apellido", request.apellido);
        usuarioPayload.put("email", request.email);
        usuarioPayload.put("telefono", request.telefono != null ? request.telefono : "");
        if (request.fechaNacimiento != null) {
            usuarioPayload.put("fechaNacimiento", request.fechaNacimiento.toString());
        }

        try (Response usersResponse = usersClient.crearUsuario(usuarioPayload)) {
            if (usersResponse.getStatus() != 201) {
                // Propaga el error de ms-users (p. ej. 409 RUT/email duplicado) tal cual.
                String body = usersResponse.hasEntity() ? usersResponse.readEntity(String.class) : "";
                return Response.status(usersResponse.getStatus()).entity(body).build();
            }

            // En un cliente JAX-RS la entidad se lee con readEntity, no con getEntity().
            @SuppressWarnings("unchecked")
            Map<String, Object> usuarioMap = usersResponse.readEntity(Map.class);
            UUID usuarioId = UUID.fromString(usuarioMap.get("id").toString());

            Map<String, Object> authPayload = new HashMap<>();
            authPayload.put("usuarioId", usuarioId.toString());
            authPayload.put("email", request.email);
            authPayload.put("password", request.password);

            try (Response authResponse = authClient.register(authPayload)) {
                if (authResponse.getStatus() >= 300) {
                    String body = authResponse.hasEntity() ? authResponse.readEntity(String.class) : "";
                    return Response.status(authResponse.getStatus()).entity(body).build();
                }
                // Devuelve el usuario creado (201) al frontend.
                return Response.status(Response.Status.CREATED).entity(usuarioMap).build();
            }
        }
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
