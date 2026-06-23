package com.grupofrontera.msauth.resource;

import com.grupofrontera.msauth.dto.*;
import com.grupofrontera.msauth.service.AuthService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @POST
    @Path("/register")
    public Response register(@Valid RegisterRequestDTO dto) {
        authService.registrar(dto);
        return Response.status(Response.Status.CREATED).build();
    }

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequestDTO dto) {
        LoginResponseDTO response = authService.login(dto);
        return Response.ok(response).build();
    }

    @POST
    @Path("/refresh")
    public Response refresh(@Valid RefreshRequestDTO dto) {
        RefreshResponseDTO response = authService.refresh(dto);
        return Response.ok(response).build();
    }

    @POST
    @Path("/logout")
    public Response logout(@Valid RefreshRequestDTO dto) {
        authService.logout(dto);
        return Response.noContent().build();
    }

    @POST
    @Path("/validate")
    public ValidateResponseDTO validate(@HeaderParam("Authorization") String authHeader) {
        return authService.validate(authHeader);
    }

    @PUT
    @Path("/credenciales/{usuarioRefId}/estado")
    public Response cambiarEstado(@PathParam("usuarioRefId") UUID usuarioRefId, @Valid EstadoRequestDTO dto) {
        authService.cambiarEstado(usuarioRefId, dto.activo);
        return Response.noContent().build();
    }
}
