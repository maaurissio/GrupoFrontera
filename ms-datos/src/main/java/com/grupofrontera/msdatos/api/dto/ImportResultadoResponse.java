package com.grupofrontera.msdatos.api.dto;

import java.util.ArrayList;
import java.util.List;

public class ImportResultadoResponse {

    public int total;
    public int insertados;
    public List<RechazoItem> rechazados = new ArrayList<>();

    public static class RechazoItem {
        public String codigo;
        public Long sucursalId;
        public String motivo;

        public RechazoItem() {
        }

        public RechazoItem(String codigo, Long sucursalId, String motivo) {
            this.codigo = codigo;
            this.sucursalId = sucursalId;
            this.motivo = motivo;
        }
    }
}
