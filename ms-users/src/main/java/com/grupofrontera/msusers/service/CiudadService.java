package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.CiudadResponseDTO;
import com.grupofrontera.msusers.entity.Ciudad;
import com.grupofrontera.msusers.entity.Region;
import com.grupofrontera.msusers.repository.CiudadRepository;
import com.grupofrontera.msusers.repository.RegionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class CiudadService {

    @Inject
    CiudadRepository ciudadRepository;

    @Inject
    RegionRepository regionRepository;

    public List<CiudadResponseDTO> listarTodas() {
        return ciudadRepository.listarPorNombre().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<CiudadResponseDTO> listarPorRegion(UUID regionId) {
        Region region = regionRepository.findByIdOptional(regionId)
                .orElseThrow(() -> new NotFoundException("Region no encontrada: " + regionId));
        return ciudadRepository.listarPorRegion(region).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CiudadResponseDTO toDTO(Ciudad c) {
        CiudadResponseDTO dto = new CiudadResponseDTO();
        dto.id = c.id;
        dto.nombre = c.nombre;
        if (c.region != null) {
            dto.regionId = c.region.id;
            dto.region = c.region.nombre;
        }
        return dto;
    }
}
