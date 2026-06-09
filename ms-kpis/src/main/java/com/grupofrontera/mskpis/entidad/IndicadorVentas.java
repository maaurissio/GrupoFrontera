package com.grupofrontera.mskpis.entidad;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Entity
@Table(name = "indicador_ventas",
        uniqueConstraints = @UniqueConstraint(columnNames = {"sucursal_ref_id", "periodo"}))
public class IndicadorVentas extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "sucursal_ref_id", nullable = false)
    public Long sucursalRefId;

    @Column(name = "periodo", nullable = false, length = 7)
    public String periodo;

    @Column(name = "total_ventas", nullable = false, precision = 15, scale = 2)
    public BigDecimal totalVentas = BigDecimal.ZERO;

    @Column(name = "cantidad_transacciones", nullable = false)
    public Integer cantidadTransacciones = 0;

    @Column(name = "ticket_promedio", nullable = false, precision = 12, scale = 2)
    public BigDecimal ticketPromedio = BigDecimal.ZERO;

    @Column(name = "meta_mensual", nullable = false, precision = 15, scale = 2)
    public BigDecimal metaMensual = BigDecimal.ZERO;

    @Column(name = "porcentaje_cumplimiento", nullable = false, precision = 5, scale = 2)
    public BigDecimal porcentajeCumplimiento = BigDecimal.ZERO;

    @Column(name = "fecha_calculo", nullable = false)
    public LocalDateTime fechaCalculo;

    public static Optional<IndicadorVentas> buscarPorSucursalYPeriodo(Long sucursalRefId, String periodo) {
        return find("sucursalRefId = ?1 and periodo = ?2", sucursalRefId, periodo).firstResultOptional();
    }

    public void recalcularTicketPromedio() {
        if (cantidadTransacciones > 0) {
            ticketPromedio = totalVentas.divide(BigDecimal.valueOf(cantidadTransacciones), 2, java.math.RoundingMode.HALF_UP);
        }
    }

    public void recalcularPorcentajeCumplimiento() {
        if (metaMensual.compareTo(BigDecimal.ZERO) > 0) {
            porcentajeCumplimiento = totalVentas
                    .multiply(BigDecimal.valueOf(100))
                    .divide(metaMensual, 2, java.math.RoundingMode.HALF_UP);
        }
    }
}
