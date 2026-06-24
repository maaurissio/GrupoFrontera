package com.grupofrontera.msreportes.servicio;

import com.grupofrontera.msreportes.entidad.ReporteGenerado;
import com.grupofrontera.msreportes.repositorio.ReporteGeneradoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class ReporteGeneradoService {

    @Inject
    ReporteGeneradoRepository repository;

    @Transactional
    public void registrar(String tipo, String formato, String periodo, Long sucursalId, String sucursalNombre) {
        ReporteGenerado r = new ReporteGenerado();
        r.tipo = tipo;
        r.formato = formato.toUpperCase();
        r.periodo = periodo;
        r.sucursalId = sucursalId;
        r.sucursalNombre = sucursalNombre;
        r.favorito = false;
        r.fechaGeneracion = LocalDateTime.now();
        repository.persist(r);
    }

    public List<ReporteGenerado> listar() {
        return repository.listarTodos();
    }

    @Transactional
    public void eliminar(Long id) {
        boolean borrado = repository.deleteById(id);
        if (!borrado) {
            throw new NotFoundException("Reporte no encontrado: " + id);
        }
    }

    @Transactional
    public ReporteGenerado marcarFavorito(Long id, boolean favorito) {
        ReporteGenerado r = repository.findById(id);
        if (r == null) {
            throw new NotFoundException("Reporte no encontrado: " + id);
        }
        r.favorito = favorito;
        return r;
    }
}
