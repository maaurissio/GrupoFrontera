package com.grupofrontera.bff.dto;

import jakarta.validation.constraints.NotNull;

public class StockAjusteDTO {

    @NotNull
    public Integer delta;
}
