package com.grupofrontera.msreportes.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class VentaPaginaDto {
    public List<VentaDto> content;
    public long totalElements;
    public int totalPages;
    public int page;
    public int size;
}
