package com.grupofrontera.msusers.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grupofrontera.msusers.dto.RolRequestDTO;
import com.grupofrontera.msusers.dto.RolResponseDTO;
import com.grupofrontera.msusers.entity.Rol;
import com.grupofrontera.msusers.enums.NombreRol;
import com.grupofrontera.msusers.repository.RolRepository;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RolServiceTest {

    @Mock
    RolRepository rolRepository;

    @InjectMocks
    RolService rolService;

    @BeforeEach
    void setUp() {
        rolService.objectMapper = new ObjectMapper();
    }

    @Test
    void crear_nombreDuplicado_lanza409() {
        RolRequestDTO dto = new RolRequestDTO();
        dto.nombre = NombreRol.ADMIN;
        dto.descripcion = "Administrador";

        when(rolRepository.existePorNombre(dto.nombre)).thenReturn(true);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> rolService.crear(dto));
        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void crear_conPermisos_serializaYRoundtripEnRespuesta() {
        RolRequestDTO dto = new RolRequestDTO();
        dto.nombre = NombreRol.SUPERVISOR;
        dto.descripcion = "Supervisor de sucursal";
        dto.permisos = Map.of("dashboard", "edicion", "reportes", "lectura");

        when(rolRepository.existePorNombre(dto.nombre)).thenReturn(false);

        RolResponseDTO resp = rolService.crear(dto);

        ArgumentCaptor<Rol> captor = ArgumentCaptor.forClass(Rol.class);
        verify(rolRepository).persist(captor.capture());
        Rol persisted = captor.getValue();

        // permisos se serializan a JSON al persistir
        assertTrue(persisted.permisos.contains("dashboard"));
        assertTrue(persisted.permisos.contains("edicion"));
        // y se deserializan de vuelta al map en la respuesta
        assertEquals("edicion", resp.permisos.get("dashboard"));
        assertEquals("lectura", resp.permisos.get("reportes"));
    }

    @Test
    void toDTO_permisosJsonInvalido_retornaMapaVacio() {
        Rol rol = new Rol();
        rol.id = UUID.randomUUID();
        rol.nombre = NombreRol.ADMIN;
        rol.permisos = "{no-es-json-valido";

        RolResponseDTO dto = rolService.toDTO(rol);

        assertNotNull(dto.permisos);
        assertTrue(dto.permisos.isEmpty());
    }
}
