package com.grupofrontera.mskpis.consumidor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grupofrontera.mskpis.dto.EventoVentaRealizada;
import com.grupofrontera.mskpis.servicio.KpisServicio;
import io.smallrye.reactive.messaging.annotations.Blocking;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ConsumidorVentaRealizada {

    private static final Logger LOG = Logger.getLogger(ConsumidorVentaRealizada.class);

    @Inject
    KpisServicio kpisServicio;

    @Inject
    ObjectMapper mapeador;

    @Incoming("venta-realizada")
    @Blocking
    public void consumir(String mensaje) {
        try {
            EventoVentaRealizada evento = mapeador.readValue(mensaje, EventoVentaRealizada.class);
            kpisServicio.procesarVentaRealizada(evento);
        } catch (Exception e) {
            LOG.errorf(e, "Error al procesar mensaje VentaRealizada: %s", mensaje);
            throw new RuntimeException("Fallo al procesar VentaRealizada — reencolar para reintento", e);
        }
    }
}
