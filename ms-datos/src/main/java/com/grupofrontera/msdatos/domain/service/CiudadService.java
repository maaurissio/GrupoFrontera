package com.grupofrontera.msdatos.domain.service;

import com.grupofrontera.msdatos.domain.entity.Ciudad;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class CiudadService {

    public List<Ciudad> listarTodas() {
        return Ciudad.listAll();
    }

    public List<Ciudad> listarPorRegion(Long regionId) {
        return Ciudad.find("region.id", regionId).list();
    }

    public Optional<Ciudad> buscarPorId(Long id) {
        return Ciudad.findByIdOptional(id);
    }

    @Transactional
    public Ciudad crear(@Valid Ciudad ciudad) {
        ciudad.persist();
        return ciudad;
    }
}
