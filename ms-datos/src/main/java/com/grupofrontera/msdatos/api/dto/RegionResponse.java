package com.grupofrontera.msdatos.api.dto;

import com.grupofrontera.msdatos.domain.entity.Region;

public class RegionResponse {

    public Long id;
    public String nombre;

    public static RegionResponse fromEntity(Region region) {
        RegionResponse r = new RegionResponse();
        r.id = region.id;
        r.nombre = region.nombre;
        return r;
    }
}
