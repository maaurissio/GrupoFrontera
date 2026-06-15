## Multi-stage build para BFF

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -DskipITs

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/quarkus-app/ ./

EXPOSE 8090
ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]
