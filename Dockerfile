# ==========================================
# SafeTrack — Single Container Build
# Builds web frontend + server + notification-service
# Exposes: WEB_PORT (nginx) and API_PORT (Spring Boot server)
# ==========================================

# ------------------------------------------
# Stage 1: Build Web Frontend
# ------------------------------------------
FROM node:22-alpine AS web-builder
WORKDIR /app
COPY packages/web/package*.json ./
RUN npm ci
COPY packages/web/ ./
RUN npm run build

# ------------------------------------------
# Stage 2: Build Java Services
# ------------------------------------------
FROM maven:3.9-eclipse-temurin-21-alpine AS maven-builder
WORKDIR /build

# Copy root POM and all module POMs first for dependency caching
COPY pom.xml .
COPY packages/shared/pom.xml packages/shared/
COPY packages/server/pom.xml packages/server/
COPY packages/notification-service/pom.xml packages/notification-service/

# Install root POM to local repo so children can resolve it
RUN mvn install -N

# Download dependencies
RUN mvn dependency:go-offline -pl packages/server,packages/notification-service -am

# Copy source code
COPY packages/shared/src packages/shared/src
COPY packages/server/src packages/server/src
COPY packages/notification-service/src packages/notification-service/src

# Build both services (and shared as dependency)
RUN mvn clean package -pl packages/server,packages/notification-service -am -DskipTests

# ------------------------------------------
# Stage 3: Runtime
# ------------------------------------------
FROM eclipse-temurin:21-jre

# Install nginx and supervisor
RUN apt-get update && \
    apt-get install -y nginx supervisor gettext-base && \
    rm -rf /var/lib/apt/lists/*

# Copy built web assets
COPY --from=web-builder /app/dist /usr/share/nginx/html

# Copy Java application JARs
COPY --from=maven-builder /build/packages/server/target/*.jar /app/server.jar
COPY --from=maven-builder /build/packages/notification-service/target/*.jar /app/notification-service.jar

# Copy configs
COPY nginx.docker.template /etc/nginx/nginx.conf.template
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Default ports (documentary — actual ports set at runtime via ENV)
EXPOSE 80 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
