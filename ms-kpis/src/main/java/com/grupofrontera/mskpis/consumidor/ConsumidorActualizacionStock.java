package com.grupofrontera.mskpis.consumidor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grupofrontera.mskpis.dto.EventoActualizacionStock;
import com.grupofrontera.mskpis.servicio.KpisServicio;
import io.smallrye.reactive.messaging.annotations.Blocking;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ConsumidorActualizacionStock {

    private static final Logger LOG = Logger.getLogger(ConsumidorActualizacionStock.class);

    @Inject
    KpisServicio kpisServicio;

    @Inject
    ObjectMapper mapeador;

    @Incoming("actualizacion-stock")
    @Blocking
    public void consumir(String mensaje) {
        try {
            EventoActualizacionStock evento = mapeador.readValue(mensaje, EventoActualizacionStock.class);
            kpisServicio.procesarActualizacionStock(evento);
        } catch (Exception e) {
            LOG.errorf(e, "Error al procesar mensaje ActualizacionStock: %s", mensaje);
            throw new RuntimeException("Fallo al procesar ActualizacionStock — reencolar para reintento", e);
        }
    }
}
