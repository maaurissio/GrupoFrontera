package com.grupofrontera.msreportes.entidad;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "reporte_generado")
public class ReporteGenerado extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tipo", nullable = false, length = 20)
    public String tipo;

    @Column(name = "formato", nullable = false, length = 10)
    public String formato;

    @Column(name = "periodo", length = 7)
    public String periodo;

    @Column(name = "sucursal_id")
    public Long sucursalId;

    @Column(name = "sucursal_nombre", length = 200)
    public String sucursalNombre;

    @Column(name = "favorito", nullable = false)
    public Boolean favorito = false;

    @Column(name = "fecha_generacion", nullable = false)
    public LocalDateTime fechaGeneracion;
}
