package com.grupofrontera.msusers.entity;

import com.grupofrontera.msusers.enums.NombreRol;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "roles")
public class Rol extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    public NombreRol nombre;

    @Column(nullable = true)
    public String descripcion;

    @Column(columnDefinition = "TEXT", nullable = true)
    public String permisos;

    @Column(nullable = false)
    public Boolean activo = true;

    @Column(nullable = false)
    public LocalDateTime creadoEn;

    @Column(nullable = false)
    public LocalDateTime actualizadoEn;
}
