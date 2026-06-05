package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.RolRequestDTO;
import com.grupofrontera.msusers.dto.RolResponseDTO;
import com.grupofrontera.msusers.entity.Rol;
import com.grupofrontera.msusers.repository.RolRepository;
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
public class RolService {

    @Inject
    RolRepository rolRepository;

    public List<RolResponseDTO> listarActivos() {
        return rolRepository.list("activo", true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public RolResponseDTO obtenerPorId(UUID id) {
        Rol rol = rolRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Rol no encontrado: " + id));
        return toDTO(rol);
    }

    @Transactional
    public RolResponseDTO crear(RolRequestDTO dto) {
        if (rolRepository.existePorNombre(dto.nombre)) {
            throw new WebApplicationException("Ya existe un rol con ese nombre", Response.Status.CONFLICT);
        }
        Rol rol = fromDTO(dto);
        rolRepository.persist(rol);
        return toDTO(rol);
    }

    @Transactional
    public RolResponseDTO actualizar(UUID id, RolRequestDTO dto) {
        Rol rol = rolRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Rol no encontrado: " + id));
        if (dto.descripcion != null) rol.descripcion = dto.descripcion;
        rol.actualizadoEn = LocalDateTime.now();
        return toDTO(rol);
    }

    @Transactional
    public void activar(UUID id) {
        Rol rol = rolRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Rol no encontrado: " + id));
        rol.activo = true;
        rol.actualizadoEn = LocalDateTime.now();
    }

    @Transactional
    public void desactivar(UUID id) {
        Rol rol = rolRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Rol no encontrado: " + id));
        rol.activo = false;
        rol.actualizadoEn = LocalDateTime.now();
    }

    public RolResponseDTO toDTO(Rol r) {
        RolResponseDTO dto = new RolResponseDTO();
        dto.id = r.id;
        dto.nombre = r.nombre;
        dto.descripcion = r.descripcion;
        return dto;
    }

    public Rol fromDTO(RolRequestDTO dto) {
        Rol rol = new Rol();
        rol.nombre = dto.nombre;
        rol.descripcion = dto.descripcion;
        rol.activo = true;
        rol.creadoEn = LocalDateTime.now();
        rol.actualizadoEn = LocalDateTime.now();
        return rol;
    }
}
