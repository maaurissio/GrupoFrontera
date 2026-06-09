package com.grupofrontera.msusers.repository;

import com.grupofrontera.msusers.entity.Usuario;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class UsuarioRepository implements PanacheRepositoryBase<Usuario, UUID> {

    public boolean existePorRut(String rut) {
        return find("rut", rut).firstResultOptional().isPresent();
    }

    public boolean existePorEmail(String email) {
        return find("email", email).firstResultOptional().isPresent();
    }
}
