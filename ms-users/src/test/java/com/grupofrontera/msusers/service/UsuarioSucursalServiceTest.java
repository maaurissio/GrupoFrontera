package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.UsuarioSucursalRequestDTO;
import com.grupofrontera.msusers.dto.UsuarioSucursalResponseDTO;
import com.grupofrontera.msusers.entity.Usuario;
import com.grupofrontera.msusers.entity.UsuarioSucursal;
import com.grupofrontera.msusers.repository.UsuarioRepository;
import com.grupofrontera.msusers.repository.UsuarioSucursalRepository;
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
class UsuarioSucursalServiceTest {

    @Mock
    UsuarioSucursalRepository usuarioSucursalRepository;

    @Mock
    UsuarioRepository usuarioRepository;

    @InjectMocks
    UsuarioSucursalService usuarioSucursalService;

    @Test
    void asignarSucursal_usuarioNoEncontrado_lanzaNotFoundException() {
        UsuarioSucursalRequestDTO dto = new UsuarioSucursalRequestDTO();
        dto.usuarioId = UUID.randomUUID();
        dto.sucursalId = 1L;

        when(usuarioRepository.findByIdOptional(dto.usuarioId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> usuarioSucursalService.asignarSucursal(dto));
    }

    @Test
    void asignarSucursal_sucursalIdNulo_lanza400() {
        Usuario usuario = new Usuario();
        usuario.id = UUID.randomUUID();

        UsuarioSucursalRequestDTO dto = new UsuarioSucursalRequestDTO();
        dto.usuarioId = usuario.id;
        dto.sucursalId = null;

        when(usuarioRepository.findByIdOptional(dto.usuarioId)).thenReturn(Optional.of(usuario));

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> usuarioSucursalService.asignarSucursal(dto));
        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void asignarSucursal_yaAsignada_lanza409() {
        Usuario usuario = new Usuario();
        usuario.id = UUID.randomUUID();

        UsuarioSucursalRequestDTO dto = new UsuarioSucursalRequestDTO();
        dto.usuarioId = usuario.id;
        dto.sucursalId = 1L;

        when(usuarioRepository.findByIdOptional(dto.usuarioId)).thenReturn(Optional.of(usuario));
        when(usuarioSucursalRepository.existeAsignacionActiva(usuario, dto.sucursalId)).thenReturn(true);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> usuarioSucursalService.asignarSucursal(dto));
        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void asignarSucursal_exitoso_persisteAsignacion() {
        Usuario usuario = new Usuario();
        usuario.id = UUID.randomUUID();
        usuario.nombre = "Juan";
        usuario.apellido = "Perez";

        UsuarioSucursalRequestDTO dto = new UsuarioSucursalRequestDTO();
        dto.usuarioId = usuario.id;
        dto.sucursalId = 2L;

        when(usuarioRepository.findByIdOptional(dto.usuarioId)).thenReturn(Optional.of(usuario));
        when(usuarioSucursalRepository.existeAsignacionActiva(usuario, dto.sucursalId)).thenReturn(false);

        UsuarioSucursalResponseDTO resp = usuarioSucursalService.asignarSucursal(dto);

        ArgumentCaptor<UsuarioSucursal> captor = ArgumentCaptor.forClass(UsuarioSucursal.class);
        verify(usuarioSucursalRepository).persist(captor.capture());
        UsuarioSucursal persisted = captor.getValue();

        assertTrue(persisted.activo);
        assertEquals(dto.sucursalId, persisted.sucursalRefId);
        assertEquals(usuario.id, resp.usuarioId);
        assertEquals(dto.sucursalId, resp.sucursalId);
    }
}
