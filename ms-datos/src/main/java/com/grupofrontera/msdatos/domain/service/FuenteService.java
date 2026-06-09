package com.grupofrontera.msdatos.domain.service;

import com.grupofrontera.msdatos.domain.entity.Fuente;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class FuenteService {

    public List<Fuente> listarTodas() {
        return Fuente.listAll();
    }

    public Optional<Fuente> buscarPorId(Long id) {
        return Fuente.findByIdOptional(id);
    }

    public Optional<Fuente> buscarPorCodigo(String codigo) {
        return Fuente.find("codigo", codigo).firstResultOptional();
    }

    @Transactional
    public Fuente crear(@Valid Fuente fuente) {
        fuente.persist();
        return fuente;
    }

    @Transactional
    public Fuente actualizar(Long id, @Valid Fuente datos) {
        Fuente fuente = Fuente.findById(id);
        if (fuente == null) {
            throw new IllegalArgumentException("Fuente no encontrada con id: " + id);
        }
        fuente.codigo = datos.codigo;
        fuente.nombre = datos.nombre;
        fuente.descripcion = datos.descripcion;
        fuente.updatedAt = java.time.LocalDateTime.now();
        fuente.persist();
        return fuente;
    }

    @Transactional
    public Fuente cambiarEstado(Long id, boolean activa) {
        Fuente fuente = Fuente.findById(id);
        if (fuente == null) {
            throw new IllegalArgumentException("Fuente no encontrada con id: " + id);
        }
        fuente.activa = activa;
        fuente.updatedAt = java.time.LocalDateTime.now();
        fuente.persist();
        return fuente;
    }

    public List<Fuente> listarActivas() {
        return Fuente.find("activa", true).list();
    }
}
