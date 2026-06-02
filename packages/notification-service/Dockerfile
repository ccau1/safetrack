# Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Copy root POM and all module POMs first for dependency caching
COPY pom.xml .
COPY packages/shared/pom.xml packages/shared/
COPY packages/server/pom.xml packages/server/
COPY packages/notification-service/pom.xml packages/notification-service/

# Install root POM to local repo so children can resolve it
RUN mvn install -N

# Download dependencies
RUN mvn dependency:go-offline -pl packages/notification-service -am

# Copy source code
COPY packages/shared/src packages/shared/src
COPY packages/notification-service/src packages/notification-service/src

# Build notification-service (and shared as dependency)
RUN mvn clean package -pl packages/notification-service -am -DskipTests

# Production stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/packages/notification-service/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
