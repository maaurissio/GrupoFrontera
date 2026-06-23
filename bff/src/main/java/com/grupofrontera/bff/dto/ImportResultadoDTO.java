package com.grupofrontera.bff.dto;

import java.util.List;

public class ImportResultadoDTO {

    public Integer total;
    public Integer insertados;
    public List<Rechazado> rechazados;

    public static class Rechazado {
        public String codigo;
        public Long sucursalId;
        public String motivo;
    }
}
