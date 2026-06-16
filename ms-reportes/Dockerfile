# ===== Build stage: compila el jar dentro de Docker (no necesitas Maven local) =====
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q dependency:go-offline || true
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ===== Runtime stage =====
FROM eclipse-temurin:21-jre
WORKDIR /deployments
COPY --from=build /build/target/quarkus-app/lib/ ./lib/
COPY --from=build /build/target/quarkus-app/*.jar ./
COPY --from=build /build/target/quarkus-app/app/ ./app/
COPY --from=build /build/target/quarkus-app/quarkus/ ./quarkus/
EXPOSE 8087
ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0"
ENTRYPOINT ["java", "-jar", "/deployments/quarkus-run.jar"]
