package com.grupofrontera.msusers.repository;

import com.grupofrontera.msusers.entity.Rol;
import com.grupofrontera.msusers.entity.Usuario;
import com.grupofrontera.msusers.entity.UsuarioRol;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class UsuarioRolRepository implements PanacheRepositoryBase<UsuarioRol, UUID> {

    public boolean existeAsignacionActiva(Usuario usuario, Rol rol) {
        return find("usuario = ?1 and rol = ?2 and activo = true", usuario, rol)
                .firstResultOptional().isPresent();
    }

    public List<UsuarioRol> listarRolesPorUsuario(Usuario usuario) {
        return list("usuario = ?1 and activo = true", usuario);
    }

    public List<UsuarioRol> listarUsuariosPorRol(Rol rol) {
        return list("rol = ?1 and activo = true", rol);
    }
}
