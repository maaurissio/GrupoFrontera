package com.grupofrontera.msdatos.api.dto;

import com.grupofrontera.msdatos.domain.entity.CategoriaProducto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ProductoRequest {

    @NotBlank(message = "El código es obligatorio")
    public String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    public String nombre;

    @NotNull(message = "El ID de sucursal es obligatorio")
    public Long sucursalId;

    @NotNull(message = "La categoría es obligatoria")
    public CategoriaProducto categoria;

    @NotNull(message = "El stock es obligatorio")
    public Integer stock;

    @NotNull(message = "El stock mínimo es obligatorio")
    public Integer stockMinimo;

    @NotNull(message = "El precio es obligatorio")
    public BigDecimal precio;

    public String descripcion;
}
