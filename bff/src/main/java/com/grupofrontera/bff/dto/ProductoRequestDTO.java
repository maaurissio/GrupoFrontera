package com.grupofrontera.bff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ProductoRequestDTO {

    @NotBlank
    public String codigo;

    @NotBlank
    public String nombre;

    @NotNull
    public Long sucursalId;

    @NotBlank
    public String categoria;

    @NotNull
    public Integer stock;

    @NotNull
    public Integer stockMinimo;

    @NotNull
    public BigDecimal precio;

    public String descripcion;
}
