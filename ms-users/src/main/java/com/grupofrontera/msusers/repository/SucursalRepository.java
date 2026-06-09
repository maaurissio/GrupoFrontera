package com.grupofrontera.msusers.repository;

import com.grupofrontera.msusers.entity.Sucursal;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class SucursalRepository implements PanacheRepositoryBase<Sucursal, UUID> {

    public boolean existePorNombre(String nombre) {
        return find("nombre", nombre).firstResultOptional().isPresent();
    }

    public boolean existePorNombreExceptoId(String nombre, UUID id) {
        return find("nombre = ?1 and id != ?2", nombre, id).firstResultOptional().isPresent();
    }
}
