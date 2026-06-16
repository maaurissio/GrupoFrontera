package com.grupofrontera.msdatos.domain.service;

import com.grupofrontera.msdatos.domain.entity.Region;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class RegionService {

    public List<Region> listarTodas() {
        return Region.listAll();
    }

    public Optional<Region> buscarPorId(Long id) {
        return Region.findByIdOptional(id);
    }

    public Optional<Region> buscarPorNombre(String nombre) {
        return Region.find("nombre", nombre).firstResultOptional();
    }

    @Transactional
    public Region crear(@Valid Region region) {
        region.persist();
        return region;
    }
}
