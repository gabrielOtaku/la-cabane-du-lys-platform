# ---- build ----
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline || true
COPY src ./src
RUN mvn -q clean package -DskipTests

# ---- run ----
# Image d'exécution minimale (Alpine + JRE 21) : surface système réduite,
# paquets mis à jour à chaque build, processus lancé sans privilèges.
# Reconstruire avec `docker compose build --pull` pour récupérer la dernière base.
FROM eclipse-temurin:21-jre-alpine
RUN apk upgrade --no-cache \
 && addgroup -S app && adduser -S -G app -h /app app
WORKDIR /app
COPY --from=build --chown=app:app /app/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
