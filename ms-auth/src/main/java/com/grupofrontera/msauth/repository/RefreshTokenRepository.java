package com.grupofrontera.msauth.repository;

import com.grupofrontera.msauth.entity.RefreshToken;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class RefreshTokenRepository implements PanacheRepositoryBase<RefreshToken, UUID> {

    public Optional<RefreshToken> findByToken(String token) {
        return find("token", token).firstResultOptional();
    }

    public void invalidarTodosPorCredencial(UUID credencialId) {
        update("invalidado = true where credencial.id = ?1 and invalidado = false", credencialId);
    }
}
