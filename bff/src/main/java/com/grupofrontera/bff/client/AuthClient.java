package com.grupofrontera.bff.client;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "ms-auth")
@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface AuthClient {

    @POST
    @Path("/register")
    Response register(Object request);

    @POST
    @Path("/login")
    Response login(Object request);

    @POST
    @Path("/refresh")
    Response refresh(Object request);

    @POST
    @Path("/logout")
    Response logout(Object request);

    @POST
    @Path("/validate")
    Object validate(String authHeader);

    @PUT
    @Path("/credenciales/{usuarioRefId}/estado")
    Response cambiarEstadoCredencial(@PathParam("usuarioRefId") UUID usuarioRefId, Object request);
}
