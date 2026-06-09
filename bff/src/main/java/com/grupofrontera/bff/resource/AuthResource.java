package com.grupofrontera.bff.resource;

import com.grupofrontera.bff.client.AuthClient;
import com.grupofrontera.bff.dto.LoginRequest;
import com.grupofrontera.bff.dto.RefreshRequest;
import com.grupofrontera.bff.dto.RegisterRequest;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@Path("/api/bff/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    @RestClient
    AuthClient authClient;

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequest request) {
        return authClient.login(request);
    }

    @POST
    @Path("/register")
    public Response register(@Valid RegisterRequest request) {
        return authClient.register(request);
    }

    @POST
    @Path("/refresh")
    public Response refresh(@Valid RefreshRequest request) {
        return authClient.refresh(request);
    }

    @POST
    @Path("/logout")
    public Response logout(@Valid RefreshRequest request) {
        return authClient.logout(request);
    }
}
