package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.RolRequestDTO;
import com.grupofrontera.msusers.dto.RolResponseDTO;
import com.grupofrontera.msusers.entity.Rol;
import com.grupofrontera.msusers.enums.NombreRol;
import com.grupofrontera.msusers.repository.RolRepository;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
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
    void crear_exitoso_quedaActivoPorDefecto() {
        RolRequestDTO dto = new RolRequestDTO();
        dto.nombre = NombreRol.SUPERVISOR;
        dto.descripcion = "Supervisor de sucursal";

        when(rolRepository.existePorNombre(dto.nombre)).thenReturn(false);

        RolResponseDTO resp = rolService.crear(dto);

        ArgumentCaptor<Rol> captor = ArgumentCaptor.forClass(Rol.class);
        verify(rolRepository).persist(captor.capture());
        Rol persisted = captor.getValue();

        assertTrue(persisted.activo);
        assertEquals(dto.nombre, persisted.nombre);
        assertEquals(dto.nombre, resp.nombre);
        assertEquals(dto.descripcion, resp.descripcion);
    }

    @Test
    void obtenerPorId_noEncontrado_lanzaNotFoundException() {
        UUID id = UUID.randomUUID();
        when(rolRepository.findByIdOptional(id)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> rolService.obtenerPorId(id));
    }
}
