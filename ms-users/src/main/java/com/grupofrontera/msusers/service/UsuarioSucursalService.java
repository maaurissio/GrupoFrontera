package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.UsuarioSucursalRequestDTO;
import com.grupofrontera.msusers.dto.UsuarioSucursalResponseDTO;
import com.grupofrontera.msusers.entity.Usuario;
import com.grupofrontera.msusers.entity.UsuarioSucursal;
import com.grupofrontera.msusers.repository.UsuarioRepository;
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
public class UsuarioSucursalService {

    @Inject
    UsuarioSucursalRepository usuarioSucursalRepository;

    @Inject
    UsuarioRepository usuarioRepository;

    public List<UsuarioSucursalResponseDTO> listarActivos() {
        return usuarioSucursalRepository.list("activo", true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<UsuarioSucursalResponseDTO> listarSucursalesPorUsuario(UUID usuarioId) {
        Usuario usuario = usuarioRepository.findByIdOptional(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + usuarioId));
        return usuarioSucursalRepository.listarSucursalesPorUsuario(usuario).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<UsuarioSucursalResponseDTO> listarUsuariosPorSucursal(Long sucursalRefId) {
        return usuarioSucursalRepository.listarUsuariosPorSucursal(sucursalRefId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UsuarioSucursalResponseDTO asignarSucursal(UsuarioSucursalRequestDTO dto) {
        Usuario usuario = usuarioRepository.findByIdOptional(dto.usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + dto.usuarioId));
        if (dto.sucursalId == null) {
            throw new WebApplicationException("sucursalId es obligatorio", Response.Status.BAD_REQUEST);
        }
        if (usuarioSucursalRepository.existeAsignacionActiva(usuario, dto.sucursalId)) {
            throw new WebApplicationException("El usuario ya tiene esa sucursal asignada", Response.Status.CONFLICT);
        }
        UsuarioSucursal us = new UsuarioSucursal();
        us.usuario = usuario;
        us.sucursalRefId = dto.sucursalId;
        us.asignadoEn = LocalDateTime.now();
        us.activo = true;
        usuarioSucursalRepository.persist(us);
        return toDTO(us);
    }

    @Transactional
    public void desactivarAsignacion(UUID id) {
        UsuarioSucursal us = usuarioSucursalRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Asignacion no encontrada: " + id));
        us.activo = false;
    }

    public UsuarioSucursalResponseDTO toDTO(UsuarioSucursal us) {
        UsuarioSucursalResponseDTO dto = new UsuarioSucursalResponseDTO();
        dto.id = us.id;
        dto.usuarioId = us.usuario.id;
        dto.nombreUsuario = us.usuario.nombre + " " + us.usuario.apellido;
        dto.sucursalId = us.sucursalRefId;
        dto.asignadoEn = us.asignadoEn;
        return dto;
    }
}
