## Este Dockerfile compila y ejecuta la aplicacion Quarkus en modo JVM.
## Usa multi-stage build: primero compila con Maven, luego ejecuta con JRE.

## ---- Etapa 1: Compilacion ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -DskipITs

## ---- Etapa 2: Ejecucion ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/quarkus-app/ ./

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]
