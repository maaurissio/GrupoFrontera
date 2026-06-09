package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.UsersClient;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/roles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RolResource {

    @Inject
    @RestClient
    UsersClient usersClient;

    @GET
    public List<Object> listar() {
        return usersClient.listarRoles();
    }

    @POST
    public Response crear(Map<String, Object> request) {
        return usersClient.crearRol(request);
    }
}
