package com.grupofrontera.msdatos.domain.service;

import com.grupofrontera.msdatos.domain.entity.DatoConsolidado;
import com.grupofrontera.msdatos.domain.entity.EstadoDato;
import com.grupofrontera.msdatos.domain.entity.Fuente;
import com.grupofrontera.msdatos.domain.entity.LogTrazabilidad;
import com.grupofrontera.msdatos.domain.entity.Sucursal;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;



@ApplicationScoped
public class DatoConsolidadoService {

    @Inject
    FuenteService fuenteService;

    @Inject
    SucursalService sucursalService;

    @Transactional
    public DatoConsolidado recibirDato(Long fuenteId, Long sucursalId, String tipoDato, LocalDate periodo, String valor) {
        Fuente fuente = fuenteService.buscarPorId(fuenteId)
                .orElseThrow(() -> new IllegalArgumentException("Fuente no encontrada: " + fuenteId));
        Sucursal sucursal = sucursalService.buscarPorId(sucursalId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada: " + sucursalId));

        DatoConsolidado dato = new DatoConsolidado();
        dato.fuente = fuente;
        dato.sucursal = sucursal;
        dato.tipoDato = tipoDato;
        dato.periodo = periodo;
        dato.valor = valor;
        dato.estado = EstadoDato.RECIBIDO;
        dato.persist();

        registrarLog(dato, "RECIBIDO", "Dato recibido desde fuente " + fuente.codigo);

        return dato;
    }

    @Transactional
    public DatoConsolidado validar(Long datoId) {
        DatoConsolidado dato = DatoConsolidado.findById(datoId);
        if (dato == null) {
            throw new IllegalArgumentException("Dato no encontrado: " + datoId);
        }

        if (dato.estado != EstadoDato.RECIBIDO) {
            throw new IllegalStateException("El dato debe estar en estado RECIBIDO para validarse. Estado actual: " + dato.estado);
        }

        if (!dato.fuente.activa) {
            dato.estado = EstadoDato.ERROR;
            dato.updatedAt = LocalDateTime.now();
            dato.persist();
            registrarLog(dato, "ERROR", "Validación fallida: la fuente " + dato.fuente.codigo + " está inactiva");
            return dato;
        }

        if (!dato.sucursal.habilitada) {
            dato.estado = EstadoDato.ERROR;
            dato.updatedAt = LocalDateTime.now();
            dato.persist();
            registrarLog(dato, "ERROR", "Validación fallida: la sucursal " + dato.sucursal.codigo + " está deshabilitada");
            return dato;
        }

        if (dato.valor == null || dato.valor.isBlank()) {
            dato.estado = EstadoDato.ERROR;
            dato.updatedAt = LocalDateTime.now();
            dato.persist();
            registrarLog(dato, "ERROR", "Validación fallida: el valor del dato está vacío");
            return dato;
        }

        dato.estado = EstadoDato.VALIDADO;
        dato.updatedAt = LocalDateTime.now();
        dato.persist();
        registrarLog(dato, "VALIDADO", "Dato validado correctamente");

        return dato;
    }

    @Transactional
    public DatoConsolidado procesar(Long datoId) {
        DatoConsolidado dato = DatoConsolidado.findById(datoId);
        if (dato == null) {
            throw new IllegalArgumentException("Dato no encontrado: " + datoId);
        }

        if (dato.estado != EstadoDato.VALIDADO) {
            throw new IllegalStateException("El dato debe estar en estado VALIDADO para procesarse. Estado actual: " + dato.estado);
        }

        try {
            dato.estado = EstadoDato.PROCESADO;
            dato.updatedAt = LocalDateTime.now();
            dato.persist();
            registrarLog(dato, "PROCESADO", "Consolidación ejecutada exitosamente");
        } catch (Exception e) {
            dato.estado = EstadoDato.ERROR;
            dato.updatedAt = LocalDateTime.now();
            dato.persist();
            registrarLog(dato, "ERROR", "Error durante la consolidación: " + e.getMessage());
        }

        return dato;
    }

    @Transactional
    public DatoConsolidado reprocesar(Long datoId) {
        DatoConsolidado dato = DatoConsolidado.findById(datoId);
        if (dato == null) {
            throw new IllegalArgumentException("Dato no encontrado: " + datoId);
        }

        if (dato.estado != EstadoDato.ERROR) {
            throw new IllegalStateException("Solo se pueden reprocesar datos en estado ERROR. Estado actual: " + dato.estado);
        }

        dato.estado = EstadoDato.RECIBIDO;
        dato.updatedAt = LocalDateTime.now();
        dato.persist();

        DatoConsolidado validado = validar(dato.id);
        if (validado.estado == EstadoDato.VALIDADO) {
            return procesar(validado.id);
        }

        registrarLog(dato, "REPROCESADO", "Reprocesamiento iniciado pero la validación falló");
        return validado;
    }

    public Optional<DatoConsolidado> buscarPorId(Long id) {
        return DatoConsolidado.findByIdOptional(id);
    }

    public List<DatoConsolidado> listarConFiltros(Long sucursalId, String tipoDato, LocalDate periodoDesde, LocalDate periodoHasta, EstadoDato estado) {
        var params = new java.util.HashMap<String, Object>();

        StringBuilder query = new StringBuilder("1 = 1");

        if (sucursalId != null) {
            query.append(" AND sucursal.id = :sucursalId");
            params.put("sucursalId", sucursalId);
        }
        if (tipoDato != null && !tipoDato.isBlank()) {
            query.append(" AND tipoDato = :tipoDato");
            params.put("tipoDato", tipoDato);
        }
        if (periodoDesde != null) {
            query.append(" AND periodo >= :periodoDesde");
            params.put("periodoDesde", periodoDesde);
        }
        if (periodoHasta != null) {
            query.append(" AND periodo <= :periodoHasta");
            params.put("periodoHasta", periodoHasta);
        }
        if (estado != null) {
            query.append(" AND estado = :estado");
            params.put("estado", estado);
        }

        return DatoConsolidado.find(query.toString(), params).list();
    }

    public List<DatoConsolidado> listarPorEstado(EstadoDato estado) {
        return DatoConsolidado.find("estado", estado).list();
    }

    public List<LogTrazabilidad> obtenerLogs(Long datoId) {
        return LogTrazabilidad.find("datoConsolidado.id", datoId).list();
    }

    @Transactional
    public void registrarLog(DatoConsolidado dato, String accion, String detalle) {
        LogTrazabilidad log = new LogTrazabilidad();
        log.datoConsolidado = dato;
        log.accion = accion;
        log.detalle = detalle;
        log.persist();
    }
}
