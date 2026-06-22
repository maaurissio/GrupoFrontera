package com.grupofrontera.msauth.repository;

import com.grupofrontera.msauth.entity.Credencial;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class CredencialRepository implements PanacheRepositoryBase<Credencial, UUID> {

    public Optional<Credencial> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    public Optional<Credencial> findByUsuarioRefId(UUID usuarioRefId) {
        return find("usuarioRefId", usuarioRefId).firstResultOptional();
    }

    public boolean existePorEmail(String email) {
        return count("email", email) > 0;
    }
}
