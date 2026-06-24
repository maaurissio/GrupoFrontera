package com.grupofrontera.msreportes.repositorio;

import com.grupofrontera.msreportes.entidad.ReporteGenerado;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class ReporteGeneradoRepository implements PanacheRepositoryBase<ReporteGenerado, Long> {

    public List<ReporteGenerado> listarTodos() {
        return list("ORDER BY fechaGeneracion DESC");
    }
}
