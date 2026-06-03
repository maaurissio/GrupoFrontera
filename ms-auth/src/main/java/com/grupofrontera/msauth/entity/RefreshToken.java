package com.grupofrontera.msauth.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "credencial_id", nullable = false)
    public Credencial credencial;

    @Column(nullable = false, unique = true, length = 512)
    public String token;

    @Column(nullable = false)
    public LocalDateTime expiresAt;

    @Column(nullable = false)
    public Boolean invalidado = false;

    @Column(nullable = false)
    public LocalDateTime creadoEn;
}
