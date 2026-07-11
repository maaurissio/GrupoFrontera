package com.grupofrontera.mskpis.entidad;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Entity
@Table(name = "venta")
public class Venta extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "sucursal_ref_id", nullable = false)
    public Long sucursalRefId;

    @Column(name = "periodo", nullable = false, length = 7)
    public String periodo;

    @Column(name = "fecha_hora", nullable = false)
    public LocalDateTime fechaHora;

    @Column(name = "monto_total", nullable = false, precision = 12, scale = 2)
    public BigDecimal montoTotal;

    @Column(name = "canal", nullable = false, length = 30)
    public String canal;

    public static Optional<Venta> buscarPorId(Long id) {
        return findByIdOptional(id);
    }
}
