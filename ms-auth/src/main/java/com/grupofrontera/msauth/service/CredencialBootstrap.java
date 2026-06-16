package com.grupofrontera.msauth.service;

import com.grupofrontera.msauth.entity.Credencial;
import com.grupofrontera.msauth.repository.CredencialRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Siembra las credenciales por defecto al arrancar.
 * <p>
 * ms-auth usa {@code drop-and-create}, así que la tabla se vacía en cada arranque.
 * Este bootstrap recrea las credenciales semilla de forma idempotente usando el
 * mismo {@link BcryptUtil} que el registro normal, por lo que el hash siempre es
 * válido para el login. Los {@code usuarioRefId} coinciden con los UUID sembrados
 * en el import.sql de ms-users.
 */
@ApplicationScoped
public class CredencialBootstrap {

    @Inject
    CredencialRepository credencialRepository;

    private record SeedCredencial(String usuarioId, String email, String password) {}

    @Transactional
    public void onStart(@Observes StartupEvent event) {
        List<SeedCredencial> seeds = List.of(
                new SeedCredencial("d1111111-1111-1111-1111-111111111111", "admin@cordillera.cl",   "Admin1234!"),
                new SeedCredencial("f3333333-3333-3333-3333-333333333333", "gerente@cordillera.cl", "Gerente1234!"),
                new SeedCredencial("e2222222-2222-2222-2222-222222222222", "soporte@cordillera.cl", "Soporte1234!")
        );

        for (SeedCredencial seed : seeds) {
            if (credencialRepository.existePorEmail(seed.email())) {
                continue;
            }
            Credencial c = new Credencial();
            c.usuarioRefId = UUID.fromString(seed.usuarioId());
            c.email = seed.email();
            c.passwordHash = BcryptUtil.bcryptHash(seed.password());
            c.activo = true;
            c.creadoEn = LocalDateTime.now();
            c.actualizadoEn = LocalDateTime.now();
            credencialRepository.persist(c);
        }
    }
}
