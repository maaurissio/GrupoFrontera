package com.grupofrontera.mskpis.entidad;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "venta_item")
public class VentaItem extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "venta_id", nullable = false)
    public Long ventaId;

    @Column(name = "producto_ref_id")
    public Long productoRefId;

    @Column(name = "codigo_producto", nullable = false, length = 50)
    public String codigoProducto;

    @Column(name = "nombre_producto", nullable = false, length = 150)
    public String nombreProducto;

    @Column(name = "categoria", length = 30)
    public String categoria;

    @Column(name = "cantidad", nullable = false)
    public Integer cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    public BigDecimal precioUnitario;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    public BigDecimal subtotal;

    public static List<VentaItem> listarPorVenta(Long ventaId) {
        return list("ventaId", ventaId);
    }
}
