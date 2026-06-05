package com.grupofrontera.msusers.repository;

import com.grupofrontera.msusers.entity.Ciudad;
import com.grupofrontera.msusers.entity.Region;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class CiudadRepository implements PanacheRepositoryBase<Ciudad, UUID> {

    public List<Ciudad> listarPorNombre() {
        return list("ORDER BY nombre");
    }

    public List<Ciudad> listarPorRegion(Region region) {
        return list("region = ?1 ORDER BY nombre", region);
    }

    public boolean existePorNombreYRegion(String nombre, Region region) {
        return find("nombre = ?1 and region = ?2", nombre, region).firstResultOptional().isPresent();
    }
}
