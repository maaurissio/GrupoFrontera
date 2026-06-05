package com.grupofrontera.msusers.repository;

import com.grupofrontera.msusers.entity.Region;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class RegionRepository implements PanacheRepositoryBase<Region, UUID> {

    public List<Region> listarPorNombre() {
        return list("ORDER BY nombre");
    }

    public boolean existePorNombre(String nombre) {
        return find("nombre", nombre).firstResultOptional().isPresent();
    }
}
