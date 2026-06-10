package com.grupofrontera.bff.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.resteasy.reactive.ClientWebApplicationException;

@Provider
public class ClientExceptionMapper implements ExceptionMapper<ClientWebApplicationException> {

    @Override
    public Response toResponse(ClientWebApplicationException e) {
        Response upstream = e.getResponse();
        int status = upstream != null ? upstream.getStatus() : 502;
        String body = "";
        try {
            if (upstream != null && upstream.hasEntity()) {
                body = upstream.readEntity(String.class);
            }
        } catch (Exception ignored) {
        }
        if (body == null || body.isBlank()) {
            body = "{\"error\":\"" + e.getMessage() + "\"}";
        }
        return Response.status(status).entity(body).type("application/json").build();
    }
}
