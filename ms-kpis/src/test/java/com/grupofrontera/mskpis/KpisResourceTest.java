package com.grupofrontera.mskpis;

import com.grupofrontera.mskpis.entidad.IndicadorVentas;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.config.JsonConfig;
import io.restassured.config.RestAssuredConfig;
import io.restassured.http.ContentType;
import io.restassured.path.json.config.JsonPathConfig;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.UserTransaction;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class KpisResourceTest {

    @Inject
    EntityManager em;

    @Inject
    UserTransaction tx;

    @BeforeAll
    static void configurarRestAssured() {
        RestAssured.config = RestAssuredConfig.config().jsonConfig(
            JsonConfig.jsonConfig().numberReturnType(JsonPathConfig.NumberReturnType.BIG_DECIMAL)
        );
    }

    @AfterEach
    void limpiarDatos() throws Exception {
        tx.begin();
        em.createQuery("DELETE FROM IndicadorInventario").executeUpdate();
        em.createQuery("DELETE FROM IndicadorVentas").executeUpdate();
        tx.commit();
    }

    @Test
    void obtenerKpis_sinDatos_retorna404() {
        given()
            .queryParam("sucursalId", 99)
            .queryParam("periodo", "2026-06")
        .when()
            .get("/kpis")
        .then()
            .statusCode(404);
    }

    @Test
    void obtenerKpis_sinParametros_retorna400() {
        given()
        .when()
            .get("/kpis")
        .then()
            .statusCode(400);
    }

    @Test
    void obtenerKpis_conDatos_retorna200ConJson() throws Exception {
        tx.begin();
        IndicadorVentas indicador = new IndicadorVentas();
        indicador.sucursalRefId = 1L;
        indicador.periodo = "2026-06";
        indicador.totalVentas = new BigDecimal("150000.00");
        indicador.cantidadTransacciones = 30;
        indicador.ticketPromedio = new BigDecimal("5000.00");
        indicador.metaMensual = new BigDecimal("200000.00");
        indicador.porcentajeCumplimiento = new BigDecimal("75.00");
        indicador.fechaCalculo = LocalDateTime.now();
        em.persist(indicador);
        tx.commit();

        given()
            .queryParam("sucursalId", 1)
            .queryParam("periodo", "2026-06")
        .when()
            .get("/kpis")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("sucursalId", is(1))
            .body("periodo", is("2026-06"))
            .body("totalVentas", comparesEqualTo(new BigDecimal("150000.00")))
            .body("cantidadTransacciones", is(30));
    }

    @Test
    void obtenerComparativo_sinDatos_retornaListaVacia() {
        given()
            .queryParam("periodo", "2026-01")
        .when()
            .get("/kpis/comparativo")
        .then()
            .statusCode(200)
            .body("$", hasSize(0));
    }
}
