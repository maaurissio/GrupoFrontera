package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.UsuarioRequestDTO;
import com.grupofrontera.msusers.dto.UsuarioResponseDTO;
import com.grupofrontera.msusers.dto.UsuarioUpdateRequestDTO;
import com.grupofrontera.msusers.entity.Usuario;
import com.grupofrontera.msusers.enums.EstadoUsuario;
import com.grupofrontera.msusers.repository.UsuarioRepository;
import com.grupofrontera.msusers.repository.UsuarioRolRepository;
import com.grupofrontera.msusers.repository.UsuarioSucursalRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class UsuarioService {

    @Inject
    UsuarioRepository usuarioRepository;

    @Inject
    UsuarioRolRepository usuarioRolRepository;

    @Inject
    UsuarioSucursalRepository usuarioSucursalRepository;

    public List<UsuarioResponseDTO> listarActivos() {
        return usuarioRepository.list("estado", EstadoUsuario.ACTIVO).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.listAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public UsuarioResponseDTO obtenerPorId(UUID id) {
        Usuario u = usuarioRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + id));
        return toDTO(u);
    }

    public List<UsuarioResponseDTO> buscarPorNombre(String nombre) {
        return usuarioRepository
                .list("lower(nombre) like ?1 and estado = ?2",
                        "%" + nombre.toLowerCase() + "%", EstadoUsuario.ACTIVO)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UsuarioResponseDTO crear(UsuarioRequestDTO dto) {
        if (usuarioRepository.existePorRut(dto.rut)) {
            throw new WebApplicationException("Ya existe un usuario con ese RUT", Response.Status.CONFLICT);
        }
        if (usuarioRepository.existePorEmail(dto.email)) {
            throw new WebApplicationException("Ya existe un usuario con ese email", Response.Status.CONFLICT);
        }
        Usuario usuario = fromDTO(dto);
        usuarioRepository.persist(usuario);
        return toDTO(usuario);
    }

    @Transactional
    public UsuarioResponseDTO actualizar(UUID id, UsuarioUpdateRequestDTO dto) {
        Usuario u = usuarioRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + id));
        if (dto.nombre != null) u.nombre = dto.nombre;
        if (dto.apellido != null) u.apellido = dto.apellido;
        if (dto.email != null) {
            if (!dto.email.equals(u.email) && usuarioRepository.existePorEmail(dto.email)) {
                throw new WebApplicationException("Ya existe un usuario con ese email", Response.Status.CONFLICT);
            }
            u.email = dto.email;
        }
        if (dto.telefono != null) u.telefono = dto.telefono;
        if (dto.fechaNacimiento != null) u.fechaNacimiento = dto.fechaNacimiento;
        u.actualizadoEn = LocalDateTime.now();
        return toDTO(u);
    }

    @Transactional
    public void activar(UUID id) {
        Usuario u = usuarioRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + id));
        u.estado = EstadoUsuario.ACTIVO;
        u.actualizadoEn = LocalDateTime.now();
    }

    @Transactional
    public void desactivar(UUID id) {
        Usuario u = usuarioRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + id));
        u.estado = EstadoUsuario.INACTIVO;
        u.actualizadoEn = LocalDateTime.now();
    }

    public UsuarioResponseDTO toDTO(Usuario u) {
        UsuarioResponseDTO dto = new UsuarioResponseDTO();
        dto.id = u.id;
        dto.rut = u.rut;
        dto.dv = u.dv;
        dto.nombre = u.nombre;
        dto.apellido = u.apellido;
        dto.email = u.email;
        dto.telefono = u.telefono;
        dto.fechaNacimiento = u.fechaNacimiento;
        dto.estado = u.estado;
        dto.roles = usuarioRolRepository.listarRolesPorUsuario(u).stream()
                .map(ur -> ur.rol.nombre.name())
                .collect(Collectors.toList());
        dto.sucursalRefIds = usuarioSucursalRepository.listarSucursalesPorUsuario(u).stream()
                .map(us -> us.sucursalRefId)
                .collect(Collectors.toList());
        return dto;
    }

    public Usuario fromDTO(UsuarioRequestDTO dto) {
        Usuario u = new Usuario();
        u.rut = dto.rut;
        u.dv = dto.dv;
        u.nombre = dto.nombre;
        u.apellido = dto.apellido;
        u.email = dto.email;
        u.telefono = dto.telefono;
        u.fechaNacimiento = dto.fechaNacimiento;
        u.estado = EstadoUsuario.ACTIVO;
        u.creadoEn = LocalDateTime.now();
        u.actualizadoEn = LocalDateTime.now();
        return u;
    }
}
