package com.grupofrontera.msusers;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
class UsersResourceTest {

    @Test
    void testListarUsuariosActivos() {
        given()
          .when().get("/usuarios")
          .then()
             .statusCode(200)
             .body(notNullValue());
    }

    @Test
    void testListarRoles() {
        given()
          .when().get("/roles")
          .then()
             .statusCode(200)
             .body(notNullValue());
    }
}
