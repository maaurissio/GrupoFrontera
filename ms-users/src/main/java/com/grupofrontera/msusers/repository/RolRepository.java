package com.grupofrontera.msusers.repository;

import com.grupofrontera.msusers.entity.Rol;
import com.grupofrontera.msusers.enums.NombreRol;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class RolRepository implements PanacheRepositoryBase<Rol, UUID> {

    public boolean existePorNombre(NombreRol nombre) {
        return find("nombre", nombre).firstResultOptional().isPresent();
    }
}
