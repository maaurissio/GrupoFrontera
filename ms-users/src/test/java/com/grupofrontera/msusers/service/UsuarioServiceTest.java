package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.UsuarioRequestDTO;
import com.grupofrontera.msusers.dto.UsuarioResponseDTO;
import com.grupofrontera.msusers.dto.UsuarioUpdateRequestDTO;
import com.grupofrontera.msusers.entity.Usuario;
import com.grupofrontera.msusers.enums.EstadoUsuario;
import com.grupofrontera.msusers.repository.UsuarioRepository;
import com.grupofrontera.msusers.repository.UsuarioRolRepository;
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

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    UsuarioRepository usuarioRepository;

    @Mock
    UsuarioRolRepository usuarioRolRepository;

    @Mock
    UsuarioSucursalRepository usuarioSucursalRepository;

    @InjectMocks
    UsuarioService usuarioService;

    private UsuarioRequestDTO nuevaSolicitud() {
        UsuarioRequestDTO dto = new UsuarioRequestDTO();
        dto.rut = "12345678";
        dto.dv = "5";
        dto.nombre = "Juan";
        dto.apellido = "Perez";
        dto.email = "juan.perez@cordillera.cl";
        dto.telefono = "+56912345678";
        dto.fechaNacimiento = LocalDate.of(1990, 1, 1);
        return dto;
    }

    @Test
    void crear_exitoso_persisteUsuarioActivo() {
        UsuarioRequestDTO dto = nuevaSolicitud();
        when(usuarioRepository.existePorRut(dto.rut)).thenReturn(false);
        when(usuarioRepository.existePorEmail(dto.email)).thenReturn(false);

        UsuarioResponseDTO resp = usuarioService.crear(dto);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).persist(captor.capture());
        Usuario persisted = captor.getValue();

        assertEquals(EstadoUsuario.ACTIVO, persisted.estado);
        assertEquals(dto.rut, persisted.rut);
        assertEquals(dto.email, persisted.email);
        assertEquals(EstadoUsuario.ACTIVO, resp.estado);
        assertEquals(dto.nombre, resp.nombre);
    }

    @Test
    void crear_rutDuplicado_lanza409() {
        UsuarioRequestDTO dto = nuevaSolicitud();
        when(usuarioRepository.existePorRut(dto.rut)).thenReturn(true);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> usuarioService.crear(dto));
        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
        verify(usuarioRepository, never()).persist(org.mockito.ArgumentMatchers.any(Usuario.class));
    }

    @Test
    void crear_emailDuplicado_lanza409() {
        UsuarioRequestDTO dto = nuevaSolicitud();
        when(usuarioRepository.existePorRut(dto.rut)).thenReturn(false);
        when(usuarioRepository.existePorEmail(dto.email)).thenReturn(true);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> usuarioService.crear(dto));
        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
        verify(usuarioRepository, never()).persist(org.mockito.ArgumentMatchers.any(Usuario.class));
    }

    @Test
    void obtenerPorId_noEncontrado_lanzaNotFoundException() {
        UUID id = UUID.randomUUID();
        when(usuarioRepository.findByIdOptional(id)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> usuarioService.obtenerPorId(id));
    }

    @Test
    void actualizar_emailYaUsadoPorOtro_lanza409() {
        UUID id = UUID.randomUUID();
        Usuario existente = new Usuario();
        existente.id = id;
        existente.nombre = "Juan";
        existente.apellido = "Perez";
        existente.email = "juan.perez@cordillera.cl";
        existente.estado = EstadoUsuario.ACTIVO;

        UsuarioUpdateRequestDTO dto = new UsuarioUpdateRequestDTO();
        dto.email = "otro@cordillera.cl";

        when(usuarioRepository.findByIdOptional(id)).thenReturn(Optional.of(existente));
        when(usuarioRepository.existePorEmail(dto.email)).thenReturn(true);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> usuarioService.actualizar(id, dto));
        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void actualizar_camposNulos_noSobrescribeValoresExistentes() {
        UUID id = UUID.randomUUID();
        Usuario existente = new Usuario();
        existente.id = id;
        existente.nombre = "Juan";
        existente.apellido = "Perez";
        existente.email = "juan.perez@cordillera.cl";
        existente.telefono = "+56911111111";
        existente.estado = EstadoUsuario.ACTIVO;

        UsuarioUpdateRequestDTO dto = new UsuarioUpdateRequestDTO();

        when(usuarioRepository.findByIdOptional(id)).thenReturn(Optional.of(existente));

        UsuarioResponseDTO resp = usuarioService.actualizar(id, dto);

        assertEquals("Juan", resp.nombre);
        assertEquals("Perez", resp.apellido);
        assertEquals("juan.perez@cordillera.cl", resp.email);
        assertEquals("+56911111111", resp.telefono);
    }

    @Test
    void activar_yDesactivar_cambianEstadoYTimestamp() {
        UUID idInactivo = UUID.randomUUID();
        Usuario inactivo = new Usuario();
        inactivo.id = idInactivo;
        inactivo.estado = EstadoUsuario.INACTIVO;
        when(usuarioRepository.findByIdOptional(idInactivo)).thenReturn(Optional.of(inactivo));

        usuarioService.activar(idInactivo);
        assertEquals(EstadoUsuario.ACTIVO, inactivo.estado);

        UUID idActivo = UUID.randomUUID();
        Usuario activo = new Usuario();
        activo.id = idActivo;
        activo.estado = EstadoUsuario.ACTIVO;
        when(usuarioRepository.findByIdOptional(idActivo)).thenReturn(Optional.of(activo));

        usuarioService.desactivar(idActivo);
        assertEquals(EstadoUsuario.INACTIVO, activo.estado);
    }
}
