package com.grupofrontera.bff;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
class BffResourceTest {
    @Test
    void testHealthEndpoint() {
        given()
          .when().get("/api/health")
          .then()
             .statusCode(200)
             .body("status", is("UP"))
             .body("service", is("bff"));
    }
}
