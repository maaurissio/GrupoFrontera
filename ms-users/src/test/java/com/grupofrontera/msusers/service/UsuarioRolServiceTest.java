package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.UsuarioRolRequestDTO;
import com.grupofrontera.msusers.dto.UsuarioRolResponseDTO;
import com.grupofrontera.msusers.entity.Rol;
import com.grupofrontera.msusers.entity.Usuario;
import com.grupofrontera.msusers.entity.UsuarioRol;
import com.grupofrontera.msusers.enums.NombreRol;
import com.grupofrontera.msusers.repository.RolRepository;
import com.grupofrontera.msusers.repository.UsuarioRepository;
import com.grupofrontera.msusers.repository.UsuarioRolRepository;
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
class UsuarioRolServiceTest {

    @Mock
    UsuarioRolRepository usuarioRolRepository;

    @Mock
    UsuarioRepository usuarioRepository;

    @Mock
    RolRepository rolRepository;

    @InjectMocks
    UsuarioRolService usuarioRolService;

    @Test
    void asignarRol_usuarioNoEncontrado_lanzaNotFoundException() {
        UsuarioRolRequestDTO dto = new UsuarioRolRequestDTO();
        dto.usuarioId = UUID.randomUUID();
        dto.rolId = UUID.randomUUID();

        when(usuarioRepository.findByIdOptional(dto.usuarioId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> usuarioRolService.asignarRol(dto));
    }

    @Test
    void asignarRol_asignacionYaActiva_lanza409() {
        Usuario usuario = new Usuario();
        usuario.id = UUID.randomUUID();
        usuario.nombre = "Juan";
        usuario.apellido = "Perez";

        Rol rol = new Rol();
        rol.id = UUID.randomUUID();
        rol.nombre = NombreRol.VENDEDOR;

        UsuarioRolRequestDTO dto = new UsuarioRolRequestDTO();
        dto.usuarioId = usuario.id;
        dto.rolId = rol.id;

        when(usuarioRepository.findByIdOptional(dto.usuarioId)).thenReturn(Optional.of(usuario));
        when(rolRepository.findByIdOptional(dto.rolId)).thenReturn(Optional.of(rol));
        when(usuarioRolRepository.existeAsignacionActiva(usuario, rol)).thenReturn(true);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> usuarioRolService.asignarRol(dto));
        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void asignarRol_exitoso_persisteAsignacionActiva() {
        Usuario usuario = new Usuario();
        usuario.id = UUID.randomUUID();
        usuario.nombre = "Juan";
        usuario.apellido = "Perez";

        Rol rol = new Rol();
        rol.id = UUID.randomUUID();
        rol.nombre = NombreRol.VENDEDOR;

        UsuarioRolRequestDTO dto = new UsuarioRolRequestDTO();
        dto.usuarioId = usuario.id;
        dto.rolId = rol.id;

        when(usuarioRepository.findByIdOptional(dto.usuarioId)).thenReturn(Optional.of(usuario));
        when(rolRepository.findByIdOptional(dto.rolId)).thenReturn(Optional.of(rol));
        when(usuarioRolRepository.existeAsignacionActiva(usuario, rol)).thenReturn(false);

        UsuarioRolResponseDTO resp = usuarioRolService.asignarRol(dto);

        ArgumentCaptor<UsuarioRol> captor = ArgumentCaptor.forClass(UsuarioRol.class);
        verify(usuarioRolRepository).persist(captor.capture());
        UsuarioRol persisted = captor.getValue();

        assertTrue(persisted.activo);
        assertEquals(usuario.id, resp.usuarioId);
        assertEquals(rol.id, resp.rolId);
        assertEquals("VENDEDOR", resp.nombreRol);
    }
}
