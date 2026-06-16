package com.grupofrontera.msreportes.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SucursalDto {
    public Long id;
    public String codigo;
    public String nombre;
    public String ciudad;
}
