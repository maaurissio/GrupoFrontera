package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.AuthClient;
import com.grupofrontera.bff.client.DatosClient;
import com.grupofrontera.bff.client.UsersClient;
import com.grupofrontera.bff.dto.SucursalDTO;
import com.grupofrontera.bff.dto.UsuarioCreateRequest;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.ArrayList;
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

    @Inject
    @RestClient
    DatosClient datosClient;

    @GET
    public List<Object> listar() {
        return enriquecerLista(usersClient.listarUsuarios());
    }

    @GET
    @Path("/todos")
    public List<Object> listarTodos() {
        return enriquecerLista(usersClient.listarTodosUsuarios());
    }

    @GET
    @Path("/{id}")
    public Object obtener(@PathParam("id") UUID id) {
        return enriquecer(usersClient.obtenerUsuario(id), mapaNombresSucursal());
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
        Response response = usersClient.activarUsuario(id);
        if (response.getStatus() < 300) {
            sincronizarCredencial(id, true);
        }
        return response;
    }

    @PUT
    @Path("/{id}/desactivar")
    public Response desactivar(@PathParam("id") UUID id) {
        Response response = usersClient.desactivarUsuario(id);
        if (response.getStatus() < 300) {
            sincronizarCredencial(id, false);
        }
        return response;
    }

    // Mantiene credencial.activo (ms-auth) en sincronia con Usuario.estado (ms-users):
    // sin esto, un usuario desactivado seguiria pudiendo iniciar sesion.
    private void sincronizarCredencial(UUID usuarioId, boolean activo) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("activo", activo);
        try (Response r = authClient.cambiarEstadoCredencial(usuarioId, payload)) {
            // Degradado: si ms-auth no responde o no tiene credencial para este usuario,
            // no bloqueamos la activacion/desactivacion ya aplicada en ms-users.
        } catch (Exception e) {
            // ignorado a proposito
        }
    }

    @POST
    @Path("/{usuarioId}/roles")
    public Response asignarRol(@PathParam("usuarioId") UUID usuarioId, Map<String, UUID> body) {
        return usersClient.asignarRol(usuarioId, body);
    }

    @GET
    @Path("/{usuarioId}/sucursales")
    @SuppressWarnings("unchecked")
    public List<Object> listarSucursales(@PathParam("usuarioId") UUID usuarioId) {
        List<Object> asignaciones = usersClient.listarSucursalesPorUsuario(usuarioId);
        if (asignaciones != null) {
            Map<Long, String> nombres = mapaNombresSucursal();
            for (Object a : asignaciones) {
                if (a instanceof Map) {
                    Map<String, Object> m = (Map<String, Object>) a;
                    Object sid = m.get("sucursalId");
                    if (sid instanceof Number) {
                        long id = ((Number) sid).longValue();
                        m.put("sucursalNombre", nombres.getOrDefault(id, "Sucursal " + id));
                    }
                }
            }
        }
        return asignaciones;
    }

    @POST
    @Path("/{usuarioId}/sucursales")
    public Response asignarSucursal(@PathParam("usuarioId") UUID usuarioId, Map<String, Object> body) {
        // ms-users espera { usuarioId, sucursalId } en el body de POST /usuario-sucursales.
        // El front solo envia { sucursalId }; aqui inyectamos el usuarioId del path.
        Map<String, Object> payload = new HashMap<>();
        payload.put("usuarioId", usuarioId.toString());
        payload.put("sucursalId", body != null ? body.get("sucursalId") : null);
        return usersClient.asignarSucursal(payload);
    }

    @DELETE
    @Path("/asignaciones-sucursal/{asignacionId}")
    public Response desasignarSucursal(@PathParam("asignacionId") UUID asignacionId) {
        return usersClient.desasignarSucursal(asignacionId);
    }

    // ------------------------------------------------------------------
    // Enriquecimiento: ms-users devuelve sucursalRefIds (ids de ms-datos);
    // aqui los resolvemos a nombres y los exponemos como `sucursales` para
    // mantener el contrato que consume el front (UsuarioDTO.sucursales).
    // ------------------------------------------------------------------

    private Map<Long, String> mapaNombresSucursal() {
        Map<Long, String> nombres = new HashMap<>();
        try {
            for (SucursalDTO s : datosClient.listarSucursales()) {
                if (s != null && s.id != null) {
                    nombres.put(s.id, s.nombre);
                }
            }
        } catch (Exception e) {
            // Degradado: si ms-datos no responde, devolvemos los usuarios sin
            // nombres de sucursal en vez de fallar todo el listado.
        }
        return nombres;
    }

    private List<Object> enriquecerLista(List<Object> usuarios) {
        if (usuarios == null) {
            return usuarios;
        }
        Map<Long, String> nombres = mapaNombresSucursal();
        for (Object u : usuarios) {
            enriquecer(u, nombres);
        }
        return usuarios;
    }

    @SuppressWarnings("unchecked")
    private Object enriquecer(Object usuario, Map<Long, String> nombres) {
        if (!(usuario instanceof Map)) {
            return usuario;
        }
        Map<String, Object> u = (Map<String, Object>) usuario;
        List<String> sucursales = new ArrayList<>();
        Object refs = u.get("sucursalRefIds");
        if (refs instanceof List) {
            for (Object r : (List<Object>) refs) {
                if (r == null) {
                    continue;
                }
                long id = (r instanceof Number) ? ((Number) r).longValue() : Long.parseLong(r.toString());
                String nombre = nombres.get(id);
                sucursales.add(nombre != null ? nombre : ("Sucursal " + id));
            }
        }
        u.put("sucursales", sucursales);
        return usuario;
    }
}
