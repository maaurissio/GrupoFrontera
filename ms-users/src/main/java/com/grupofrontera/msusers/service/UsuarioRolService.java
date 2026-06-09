package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.UsuarioRolRequestDTO;
import com.grupofrontera.msusers.dto.UsuarioRolResponseDTO;
import com.grupofrontera.msusers.entity.Rol;
import com.grupofrontera.msusers.entity.Usuario;
import com.grupofrontera.msusers.entity.UsuarioRol;
import com.grupofrontera.msusers.repository.RolRepository;
import com.grupofrontera.msusers.repository.UsuarioRepository;
import com.grupofrontera.msusers.repository.UsuarioRolRepository;
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
public class UsuarioRolService {

    @Inject
    UsuarioRolRepository usuarioRolRepository;

    @Inject
    UsuarioRepository usuarioRepository;

    @Inject
    RolRepository rolRepository;

    public List<UsuarioRolResponseDTO> listarActivos() {
        return usuarioRolRepository.list("activo", true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<UsuarioRolResponseDTO> listarRolesPorUsuario(UUID usuarioId) {
        Usuario usuario = usuarioRepository.findByIdOptional(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + usuarioId));
        return usuarioRolRepository.listarRolesPorUsuario(usuario).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<UsuarioRolResponseDTO> listarUsuariosPorRol(UUID rolId) {
        Rol rol = rolRepository.findByIdOptional(rolId)
                .orElseThrow(() -> new NotFoundException("Rol no encontrado: " + rolId));
        return usuarioRolRepository.listarUsuariosPorRol(rol).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UsuarioRolResponseDTO asignarRol(UsuarioRolRequestDTO dto) {
        Usuario usuario = usuarioRepository.findByIdOptional(dto.usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + dto.usuarioId));
        Rol rol = rolRepository.findByIdOptional(dto.rolId)
                .orElseThrow(() -> new NotFoundException("Rol no encontrado: " + dto.rolId));
        if (usuarioRolRepository.existeAsignacionActiva(usuario, rol)) {
            throw new WebApplicationException("El usuario ya tiene ese rol activo", Response.Status.CONFLICT);
        }
        UsuarioRol ur = new UsuarioRol();
        ur.usuario = usuario;
        ur.rol = rol;
        ur.asignadoEn = LocalDateTime.now();
        ur.activo = true;
        usuarioRolRepository.persist(ur);
        return toDTO(ur);
    }

    @Transactional
    public void desactivarAsignacion(UUID id) {
        UsuarioRol ur = usuarioRolRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Asignacion no encontrada: " + id));
        ur.activo = false;
    }

    public UsuarioRolResponseDTO toDTO(UsuarioRol ur) {
        UsuarioRolResponseDTO dto = new UsuarioRolResponseDTO();
        dto.id = ur.id;
        dto.usuarioId = ur.usuario.id;
        dto.nombreUsuario = ur.usuario.nombre + " " + ur.usuario.apellido;
        dto.rolId = ur.rol.id;
        dto.nombreRol = ur.rol.nombre.name();
        dto.asignadoEn = ur.asignadoEn;
        return dto;
    }
}
