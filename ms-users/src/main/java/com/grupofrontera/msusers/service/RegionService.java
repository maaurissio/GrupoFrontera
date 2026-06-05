package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.dto.RegionResponseDTO;
import com.grupofrontera.msusers.entity.Region;
import com.grupofrontera.msusers.repository.RegionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class RegionService {

    @Inject
    RegionRepository regionRepository;

    public List<RegionResponseDTO> listarTodas() {
        return regionRepository.listarPorNombre().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public RegionResponseDTO toDTO(Region r) {
        RegionResponseDTO dto = new RegionResponseDTO();
        dto.id = r.id;
        dto.nombre = r.nombre;
        return dto;
    }
}
