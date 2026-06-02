package com.grupofrontera.msdatos.domain.service;

import com.grupofrontera.msdatos.domain.entity.Sucursal;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class SucursalService {

    public List<Sucursal> listarTodas() {
        return Sucursal.listAll();
    }

    public Optional<Sucursal> buscarPorId(Long id) {
        return Sucursal.findByIdOptional(id);
    }

    public Optional<Sucursal> buscarPorCodigo(String codigo) {
        return Sucursal.find("codigo", codigo).firstResultOptional();
    }

    @Transactional
    public Sucursal crear(@Valid Sucursal sucursal) {
        sucursal.persist();
        return sucursal;
    }

    @Transactional
    public Sucursal actualizar(Long id, @Valid Sucursal datos) {
        Sucursal sucursal = Sucursal.findById(id);
        if (sucursal == null) {
            throw new IllegalArgumentException("Sucursal no encontrada con id: " + id);
        }
        sucursal.codigo = datos.codigo;
        sucursal.nombre = datos.nombre;
        sucursal.ciudad = datos.ciudad;
        sucursal.updatedAt = LocalDateTime.now();
        sucursal.persist();
        return sucursal;
    }

    @Transactional
    public Sucursal cambiarEstado(Long id, boolean habilitada) {
        Sucursal sucursal = Sucursal.findById(id);
        if (sucursal == null) {
            throw new IllegalArgumentException("Sucursal no encontrada con id: " + id);
        }
        sucursal.habilitada = habilitada;
        sucursal.updatedAt = LocalDateTime.now();
        sucursal.persist();
        return sucursal;
    }

    public List<Sucursal> listarHabilitadas() {
        return Sucursal.find("habilitada", true).list();
    }
}
