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

    // Referencia logica a la sucursal que vive en ms-datos (id Long).
    // No es FK real: cruza el limite del microservicio.
    @Column(name = "sucursal_ref_id", nullable = false)
    public Long sucursalRefId;

    @Column(nullable = false)
    public LocalDateTime asignadoEn;

    @Column(nullable = false)
    public Boolean activo = true;
}
