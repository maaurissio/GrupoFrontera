package com.grupofrontera.msdatos.api.dto;

import com.grupofrontera.msdatos.domain.entity.Ciudad;

public class CiudadResponse {

    public Long id;
    public String nombre;
    public Long regionId;
    public String regionNombre;

    public static CiudadResponse fromEntity(Ciudad ciudad) {
        CiudadResponse r = new CiudadResponse();
        r.id = ciudad.id;
        r.nombre = ciudad.nombre;
        if (ciudad.region != null) {
            r.regionId = ciudad.region.id;
            r.regionNombre = ciudad.region.nombre;
        }
        return r;
    }
}
