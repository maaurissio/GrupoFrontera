package com.grupofrontera.msusers.repository;

import com.grupofrontera.msusers.entity.Sucursal;
import com.grupofrontera.msusers.entity.Usuario;
import com.grupofrontera.msusers.entity.UsuarioSucursal;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class UsuarioSucursalRepository implements PanacheRepositoryBase<UsuarioSucursal, UUID> {

    public boolean existeAsignacionActiva(Usuario usuario, Sucursal sucursal) {
        return find("usuario = ?1 and sucursal = ?2 and activo = true", usuario, sucursal)
                .firstResultOptional().isPresent();
    }

    public List<UsuarioSucursal> listarSucursalesPorUsuario(Usuario usuario) {
        return list("usuario = ?1 and activo = true", usuario);
    }

    public List<UsuarioSucursal> listarUsuariosPorSucursal(Sucursal sucursal) {
        return list("sucursal = ?1 and activo = true", sucursal);
    }
}
