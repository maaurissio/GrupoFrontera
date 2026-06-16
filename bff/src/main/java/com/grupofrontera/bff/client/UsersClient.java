package com.grupofrontera.bff.client;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "ms-users")
@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface UsersClient {

    // Usuarios
    @GET @Path("/usuarios")
    List<Object> listarUsuarios();

    @GET @Path("/usuarios/todos")
    List<Object> listarTodosUsuarios();

    @GET @Path("/usuarios/{id}")
    Object obtenerUsuario(@PathParam("id") UUID id);

    @POST @Path("/usuarios")
    Response crearUsuario(Object request);

    @PUT @Path("/usuarios/{id}")
    Object actualizarUsuario(@PathParam("id") UUID id, Object request);

    @PUT @Path("/usuarios/{id}/activar")
    Response activarUsuario(@PathParam("id") UUID id);

    @PUT @Path("/usuarios/{id}/desactivar")
    Response desactivarUsuario(@PathParam("id") UUID id);

    // Roles
    @GET @Path("/roles")
    List<Object> listarRoles();

    @POST @Path("/roles")
    Response crearRol(Object request);

    // Usuario-Rol
    @POST @Path("/usuarios/{usuarioId}/roles")
    Response asignarRol(@PathParam("usuarioId") UUID usuarioId, Object request);

    // Usuario-Sucursal (asignacion; la sucursal vive en ms-datos)
    @GET @Path("/usuarios/{usuarioId}/sucursales")
    List<Object> listarSucursalesPorUsuario(@PathParam("usuarioId") UUID usuarioId);

    @POST @Path("/usuarios/{usuarioId}/sucursales")
    Response asignarSucursal(@PathParam("usuarioId") UUID usuarioId, Object request);
}
