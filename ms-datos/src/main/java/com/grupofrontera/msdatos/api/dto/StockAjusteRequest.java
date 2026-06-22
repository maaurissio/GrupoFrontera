package com.grupofrontera.msdatos.api.dto;

import jakarta.validation.constraints.NotNull;

public class StockAjusteRequest {

    @NotNull(message = "El delta de stock es obligatorio")
    public Integer delta;
}
