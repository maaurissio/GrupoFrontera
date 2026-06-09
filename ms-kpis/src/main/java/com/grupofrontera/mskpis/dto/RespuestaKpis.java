package com.grupofrontera.mskpis.dto;

import com.grupofrontera.mskpis.entidad.IndicadorInventario;
import com.grupofrontera.mskpis.entidad.IndicadorVentas;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RespuestaKpis {

    public Long sucursalId;
    public String periodo;

    public BigDecimal totalVentas;
    public Integer cantidadTransacciones;
    public BigDecimal ticketPromedio;
    public BigDecimal metaMensual;
    public BigDecimal porcentajeCumplimiento;
    public LocalDateTime fechaCalculoVentas;

    public Integer productosBajoMinimo;
    public BigDecimal rotacionPromedio;
    public Integer diasSinReposicion;
    public LocalDateTime fechaCalculoInventario;

    public static RespuestaKpis desde(IndicadorVentas ventas, IndicadorInventario inventario) {
        RespuestaKpis respuesta = new RespuestaKpis();
        respuesta.sucursalId = ventas.sucursalRefId;
        respuesta.periodo = ventas.periodo;
        respuesta.totalVentas = ventas.totalVentas;
        respuesta.cantidadTransacciones = ventas.cantidadTransacciones;
        respuesta.ticketPromedio = ventas.ticketPromedio;
        respuesta.metaMensual = ventas.metaMensual;
        respuesta.porcentajeCumplimiento = ventas.porcentajeCumplimiento;
        respuesta.fechaCalculoVentas = ventas.fechaCalculo;

        if (inventario != null) {
            respuesta.productosBajoMinimo = inventario.productosBajoMinimo;
            respuesta.rotacionPromedio = inventario.rotacionPromedio;
            respuesta.diasSinReposicion = inventario.diasSinReposicion;
            respuesta.fechaCalculoInventario = inventario.fechaCalculo;
        } else {
            respuesta.productosBajoMinimo = 0;
            respuesta.rotacionPromedio = BigDecimal.ZERO;
            respuesta.diasSinReposicion = 0;
        }
        return respuesta;
    }
}
