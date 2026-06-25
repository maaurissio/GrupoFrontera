package com.grupofrontera.msdatos;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
class DatosResourceTest {
    @Test
    void testHealthEndpoint() {
        given()
          .when().get("/api/datos")
          .then()
             .statusCode(200);
    }
}
