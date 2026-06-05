package com.grupofrontera.msusers.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "usuario_sucursales")
public class UsuarioSucursal extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    public Usuario usuario;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sucursal_id", nullable = false)
    public Sucursal sucursal;

    @Column(nullable = false)
    public LocalDateTime asignadoEn;

    @Column(nullable = false)
    public Boolean activo = true;
}
