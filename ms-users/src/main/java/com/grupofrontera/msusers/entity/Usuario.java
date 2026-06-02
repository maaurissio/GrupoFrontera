package com.grupofrontera.msusers.entity;

import com.grupofrontera.msusers.enums.EstadoUsuario;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
public class Usuario extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(nullable = false, unique = true)
    public String rut;

    @Column(nullable = false)
    public String dv;

    @Column(nullable = false)
    public String nombre;

    @Column(nullable = false)
    public String apellido;

    @Column(nullable = false, unique = true)
    public String email;

    @Column(nullable = true)
    public String telefono;

    @Column(nullable = true)
    public LocalDate fechaNacimiento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public EstadoUsuario estado;

    @Column(nullable = false)
    public LocalDateTime creadoEn;

    @Column(nullable = false)
    public LocalDateTime actualizadoEn;
}
