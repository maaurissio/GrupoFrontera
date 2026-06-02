package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.SucursalRequestDTO;
import com.grupofrontera.msusers.dto.SucursalResponseDTO;
import com.grupofrontera.msusers.entity.Ciudad;
import com.grupofrontera.msusers.entity.Sucursal;
import com.grupofrontera.msusers.repository.CiudadRepository;
import com.grupofrontera.msusers.repository.SucursalRepository;
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
public class SucursalService {

    @Inject
    SucursalRepository sucursalRepository;

    @Inject
    CiudadRepository ciudadRepository;

    public List<SucursalResponseDTO> listarActivos() {
        return sucursalRepository.list("activo", true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public SucursalResponseDTO obtenerPorId(UUID id) {
        Sucursal s = sucursalRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Sucursal no encontrada: " + id));
        return toDTO(s);
    }

    @Transactional
    public SucursalResponseDTO crear(SucursalRequestDTO dto) {
        if (sucursalRepository.existePorNombre(dto.nombre)) {
            throw new WebApplicationException("Ya existe una sucursal con ese nombre", Response.Status.CONFLICT);
        }
        Ciudad ciudad = null;
        if (dto.ciudadId != null) {
            ciudad = ciudadRepository.findByIdOptional(dto.ciudadId)
                    .orElseThrow(() -> new NotFoundException("Ciudad no encontrada: " + dto.ciudadId));
        }
        Sucursal s = new Sucursal();
        s.nombre = dto.nombre;
        s.direccion = dto.direccion;
        s.ciudad = ciudad;
        s.activo = true;
        s.creadoEn = LocalDateTime.now();
        s.actualizadoEn = LocalDateTime.now();
        sucursalRepository.persist(s);
        return toDTO(s);
    }

    @Transactional
    public SucursalResponseDTO actualizar(UUID id, SucursalRequestDTO dto) {
        Sucursal s = sucursalRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Sucursal no encontrada: " + id));
        if (dto.nombre != null && !dto.nombre.equals(s.nombre)) {
            if (sucursalRepository.existePorNombreExceptoId(dto.nombre, id)) {
                throw new WebApplicationException("Ya existe una sucursal con ese nombre", Response.Status.CONFLICT);
            }
            s.nombre = dto.nombre;
        }
        if (dto.direccion != null) s.direccion = dto.direccion;
        if (dto.ciudadId != null) {
            s.ciudad = ciudadRepository.findByIdOptional(dto.ciudadId)
                    .orElseThrow(() -> new NotFoundException("Ciudad no encontrada: " + dto.ciudadId));
        }
        s.actualizadoEn = LocalDateTime.now();
        return toDTO(s);
    }

    @Transactional
    public void activar(UUID id) {
        Sucursal s = sucursalRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Sucursal no encontrada: " + id));
        s.activo = true;
        s.actualizadoEn = LocalDateTime.now();
    }

    @Transactional
    public void desactivar(UUID id) {
        Sucursal s = sucursalRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Sucursal no encontrada: " + id));
        s.activo = false;
        s.actualizadoEn = LocalDateTime.now();
    }

    public SucursalResponseDTO toDTO(Sucursal s) {
        SucursalResponseDTO dto = new SucursalResponseDTO();
        dto.id = s.id;
        dto.nombre = s.nombre;
        dto.direccion = s.direccion;
        if (s.ciudad != null) {
            dto.ciudadId = s.ciudad.id;
            dto.ciudad = s.ciudad.nombre;
            if (s.ciudad.region != null) {
                dto.regionId = s.ciudad.region.id;
                dto.region = s.ciudad.region.nombre;
            }
        }
        return dto;
    }
}
