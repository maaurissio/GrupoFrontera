package com.grupofrontera.msusers.service;

import com.grupofrontera.msusers.entity.Ciudad;
import com.grupofrontera.msusers.entity.Region;
import com.grupofrontera.msusers.repository.CiudadRepository;
import com.grupofrontera.msusers.repository.RegionRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.Map;

@ApplicationScoped
public class CatalogoGeograficoBootstrap {

    @Inject
    RegionRepository regionRepository;

    @Inject
    CiudadRepository ciudadRepository;

    @Transactional
    public void onStart(@Observes StartupEvent event) {
        Map<String, String[]> catalogo = Map.of(
                "Region Metropolitana de Santiago", new String[]{"Santiago"},
                "Region de Valparaiso", new String[]{"Valparaiso"},
                "Region del Biobio", new String[]{"Concepcion"}
        );

        for (Map.Entry<String, String[]> entry : catalogo.entrySet()) {
            String nombreRegion = entry.getKey();
            Region region;
            if (!regionRepository.existePorNombre(nombreRegion)) {
                region = new Region();
                region.nombre = nombreRegion;
                regionRepository.persist(region);
            } else {
                region = regionRepository.find("nombre", nombreRegion).firstResult();
            }
            for (String nombreCiudad : entry.getValue()) {
                if (!ciudadRepository.existePorNombreYRegion(nombreCiudad, region)) {
                    Ciudad ciudad = new Ciudad();
                    ciudad.nombre = nombreCiudad;
                    ciudad.region = region;
                    ciudadRepository.persist(ciudad);
                }
            }
        }
    }
}
