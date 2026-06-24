package com.grupofrontera.msdatos.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;

@Entity
@Table(name = "sucursal")
public class Sucursal extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @NotBlank
    @Column(name = "codigo", nullable = false, unique = true, length = 50)
    public String codigo;

    @NotBlank
    @Column(name = "nombre", nullable = false, length = 200)
    public String nombre;

    @NotBlank
    @Column(name = "ciudad", nullable = false, length = 150)
    public String ciudad;

    @Column(name = "habilitada", nullable = false)
    public Boolean habilitada = true;

    @Column(name = "latitud")
    public Double latitud;

    @Column(name = "longitud")
    public Double longitud;

    // Referencia opcional al catalogo geografico (Ciudad vive en la misma BD).
    // Se mantiene tambien el campo de texto 'ciudad' por compatibilidad con el front.
    @Column(name = "ciudad_id")
    public Long ciudadId;

    @Column(name = "direccion", length = 250)
    public String direccion;

    @Column(name = "anio_apertura")
    public Integer anioApertura;

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
