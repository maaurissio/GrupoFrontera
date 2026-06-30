package com.grupofrontera.bff.exception;

import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.ClientWebApplicationException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ClientExceptionMapperTest {

    private final ClientExceptionMapper mapper = new ClientExceptionMapper();

    @Test
    void toResponse_conStatus404_retorna404() {
        Response upstream = Response.status(404).entity("{\"error\":\"Not found\"}").build();
        ClientWebApplicationException ex = new ClientWebApplicationException(upstream);

        Response result = mapper.toResponse(ex);

        assertEquals(404, result.getStatus());
        assertEquals("{\"error\":\"Not found\"}", result.getEntity());
    }

    @Test
    void toResponse_conStatus409_retorna409() {
        Response upstream = Response.status(409).entity("{\"error\":\"Duplicado\"}").build();
        ClientWebApplicationException ex = new ClientWebApplicationException(upstream);

        Response result = mapper.toResponse(ex);

        assertEquals(409, result.getStatus());
        assertEquals("{\"error\":\"Duplicado\"}", result.getEntity());
    }

    @Test
    void toResponse_sinCuerpo_generaMensajePorDefecto() {
        Response upstream = Response.status(502).build();
        ClientWebApplicationException ex = new ClientWebApplicationException(upstream);

        Response result = mapper.toResponse(ex);

        assertEquals(502, result.getStatus());
        assertNotNull(result.getEntity());
    }

    @Test
    void toResponse_conStatusYNuloBody_generaMensaje() {
        ClientWebApplicationException ex = new ClientWebApplicationException(Response.serverError().build());

        Response result = mapper.toResponse(ex);

        assertEquals(500, result.getStatus());
    }

    @Test
    void toResponse_conBodyEnBlanco_generaMensajePorDefecto() {
        Response upstream = Response.status(500).entity("   ").build();
        ClientWebApplicationException ex = new ClientWebApplicationException(upstream);

        Response result = mapper.toResponse(ex);

        assertEquals(500, result.getStatus());
        assertTrue(result.getEntity().toString().contains("error"));
    }

    @Test
    void toResponse_respuestaSiempreEsJson() {
        Response upstream = Response.status(404).entity("{\"error\":\"x\"}").build();
        ClientWebApplicationException ex = new ClientWebApplicationException(upstream);

        Response result = mapper.toResponse(ex);

        assertEquals("application/json", result.getMediaType().toString());
    }
}
