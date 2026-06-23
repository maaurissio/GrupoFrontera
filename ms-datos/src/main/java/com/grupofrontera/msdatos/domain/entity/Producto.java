package com.grupofrontera.msdatos.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;

@Entity
@Table(name = "producto")
public class Producto extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @NotBlank
    @Column(name = "codigo", nullable = false, length = 100)
    public String codigo;

    @NotBlank
    @Column(name = "nombre", nullable = false, length = 200)
    public String nombre;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id", nullable = false)
    public Sucursal sucursal;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", nullable = false, length = 40)
    public CategoriaProducto categoria;

    @Column(name = "stock", nullable = false)
    public Integer stock = 0;

    @Column(name = "stock_minimo", nullable = false)
    public Integer stockMinimo = 0;

    @Column(name = "precio", nullable = false, precision = 12, scale = 2)
    public BigDecimal precio = BigDecimal.ZERO;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    public String descripcion;

    @Column(name = "activo", nullable = false)
    public Boolean activo = true;

    @Column(name = "fecha_actualizacion_stock")
    public LocalDateTime fechaActualizacionStock;

    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Override
    public void persist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
        super.persist();
    }
}
