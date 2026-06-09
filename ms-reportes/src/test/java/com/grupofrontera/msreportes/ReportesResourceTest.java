package com.grupofrontera.msreportes;

import com.grupofrontera.msreportes.cliente.ClienteKpis;
import com.grupofrontera.msreportes.dto.RespuestaKpisDto;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.config.JsonConfig;
import io.restassured.config.RestAssuredConfig;
import io.restassured.http.ContentType;
import io.restassured.path.json.config.JsonPathConfig;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class ReportesResourceTest {

    @InjectMock
    @RestClient
    ClienteKpis clienteKpis;

    @BeforeAll
    static void configurarRestAssured() {
        RestAssured.config = RestAssuredConfig.config().jsonConfig(
            JsonConfig.jsonConfig().numberReturnType(JsonPathConfig.NumberReturnType.BIG_DECIMAL)
        );
    }

    private RespuestaKpisDto crearRespuestaEjemplo(Long sucursalId, String periodo) {
        RespuestaKpisDto dto = new RespuestaKpisDto();
        dto.sucursalId = sucursalId;
        dto.periodo = periodo;
        dto.totalVentas = new BigDecimal("500000.00");
        dto.metaMensual = new BigDecimal("600000.00");
        dto.porcentajeCumplimiento = new BigDecimal("83.33");
        dto.cantidadTransacciones = 100;
        dto.ticketPromedio = new BigDecimal("5000.00");
        dto.productosBajoMinimo = 3;
        dto.rotacionPromedio = BigDecimal.valueOf(2.5);
        dto.diasSinReposicion = 5;
        return dto;
    }

    @Test
    void obtenerDashboard_conDatos_retornaJson() {
        RespuestaKpisDto respuesta = crearRespuestaEjemplo(1L, "2026-06");
        Mockito.when(clienteKpis.obtenerKpis(1L, "2026-06")).thenReturn(respuesta);

        // La variacion llama al periodo anterior y puede lanzar 404
        Mockito.when(clienteKpis.obtenerKpis(1L, "2026-05"))
                .thenThrow(new WebApplicationException(Response.status(404).build()));

        given()
            .queryParam("sucursalId", 1)
            .queryParam("periodo", "2026-06")
        .when()
            .get("/reportes/dashboard")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("sucursalId", is(1))
            .body("periodo", is("2026-06"))
            .body("totalVentas", comparesEqualTo(new BigDecimal("500000.00")))
            .body("disponibilidadSistema", is(true));
    }

    @Test
    void obtenerDashboard_sinParametros_retorna400() {
        given()
        .when()
            .get("/reportes/dashboard")
        .then()
            .statusCode(400);
    }

    @Test
    void exportar_formatoPdf_retornaContentTypeCorrecto() {
        RespuestaKpisDto respuesta = crearRespuestaEjemplo(1L, "2026-06");
        Mockito.when(clienteKpis.obtenerKpis(1L, "2026-06")).thenReturn(respuesta);
        Mockito.when(clienteKpis.obtenerKpis(1L, "2026-05"))
                .thenThrow(new WebApplicationException(Response.status(404).build()));

        given()
            .queryParam("formato", "pdf")
            .queryParam("sucursalId", 1)
            .queryParam("periodo", "2026-06")
        .when()
            .get("/reportes/exportar")
        .then()
            .statusCode(200)
            .contentType("application/pdf")
            .header("Content-Disposition", containsString("reporte_sucursal1_2026-06.pdf"));
    }

    @Test
    void exportar_formatoExcel_retornaContentTypeCorrecto() {
        RespuestaKpisDto respuesta = crearRespuestaEjemplo(1L, "2026-06");
        Mockito.when(clienteKpis.obtenerKpis(1L, "2026-06")).thenReturn(respuesta);
        Mockito.when(clienteKpis.obtenerKpis(1L, "2026-05"))
                .thenThrow(new WebApplicationException(Response.status(404).build()));

        given()
            .queryParam("formato", "xlsx")
            .queryParam("sucursalId", 1)
            .queryParam("periodo", "2026-06")
        .when()
            .get("/reportes/exportar")
        .then()
            .statusCode(200)
            .contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            .header("Content-Disposition", containsString("reporte_sucursal1_2026-06.xlsx"));
    }

    @Test
    void obtenerComparativo_conDatos_retornaLista() {
        RespuestaKpisDto dto1 = crearRespuestaEjemplo(1L, "2026-06");
        RespuestaKpisDto dto2 = crearRespuestaEjemplo(2L, "2026-06");
        dto2.totalVentas = new BigDecimal("300000.00");

        Mockito.when(clienteKpis.obtenerComparativo("2026-06")).thenReturn(List.of(dto1, dto2));
        Mockito.when(clienteKpis.obtenerKpis(Mockito.anyLong(), Mockito.eq("2026-05")))
                .thenThrow(new WebApplicationException(Response.status(404).build()));
        Mockito.when(clienteKpis.obtenerKpis(Mockito.anyLong(), Mockito.eq("2026-06")))
                .thenReturn(dto1);

        given()
            .queryParam("periodo", "2026-06")
        .when()
            .get("/reportes/comparativo")
        .then()
            .statusCode(200)
            .body("$", hasSize(2));
    }
}
