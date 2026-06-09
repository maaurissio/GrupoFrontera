package com.grupofrontera.msdatos.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;

@Entity
@Table(name = "log_trazabilidad")
public class LogTrazabilidad extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dato_consolidado_id", nullable = false)
    public DatoConsolidado datoConsolidado;

    @NotBlank
    @Column(name = "accion", nullable = false, length = 50)
    public String accion;

    @Column(name = "detalle", columnDefinition = "TEXT")
    public String detalle;

    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @Override
    public void persist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        super.persist();
    }
}
