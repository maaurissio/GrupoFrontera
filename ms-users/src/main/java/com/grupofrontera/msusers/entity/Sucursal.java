package com.grupofrontera.msusers.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sucursales")
public class Sucursal extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(nullable = false, unique = true)
    public String nombre;

    @Column(nullable = false)
    public String direccion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ciudad_id")
    public Ciudad ciudad;

    @Column(nullable = false)
    public Boolean activo = true;

    @Column(nullable = false)
    public LocalDateTime creadoEn;

    @Column(nullable = false)
    public LocalDateTime actualizadoEn;
}
