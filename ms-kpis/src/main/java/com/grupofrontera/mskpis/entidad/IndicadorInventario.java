package com.grupofrontera.mskpis.entidad;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Entity
@Table(name = "indicador_inventario",
        uniqueConstraints = @UniqueConstraint(columnNames = {"sucursal_ref_id", "periodo"}))
public class IndicadorInventario extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "sucursal_ref_id", nullable = false)
    public Long sucursalRefId;

    @Column(name = "periodo", nullable = false, length = 7)
    public String periodo;

    @Column(name = "productos_bajo_minimo", nullable = false)
    public Integer productosBajoMinimo = 0;

    @Column(name = "rotacion_promedio", nullable = false, precision = 8, scale = 2)
    public BigDecimal rotacionPromedio = BigDecimal.ZERO;

    @Column(name = "dias_sin_reposicion", nullable = false)
    public Integer diasSinReposicion = 0;

    @Column(name = "fecha_calculo", nullable = false)
    public LocalDateTime fechaCalculo;

    public static Optional<IndicadorInventario> buscarPorSucursalYPeriodo(Long sucursalRefId, String periodo) {
        return find("sucursalRefId = ?1 and periodo = ?2", sucursalRefId, periodo).firstResultOptional();
    }

    public static List<IndicadorInventario> listarPorPeriodo(String periodo) {
        return list("periodo", periodo);
    }
}
