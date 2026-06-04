.PHONY: up down build build-shared up-prod down-prod build-prod up-single down-single build-single dev dev-down

# --- Dev mode with hot reload (default) ---
up:
	docker-compose -f docker-compose.dev.yml up --build -d

down:
	docker-compose -f docker-compose.dev.yml down

build:
	docker-compose -f docker-compose.dev.yml build

# --- Production-style static build ---
up-prod:
	docker-compose up --build -d

down-prod:
	docker-compose down

build-prod:
	docker-compose build

# --- Dev mode aliases ---
dev:
	docker-compose -f docker-compose.dev.yml up --build -d

dev-down:
	docker-compose -f docker-compose.dev.yml down

# --- Single-container compose ---
up-single:
	docker-compose -f docker-compose.single.yml up --build -d

down-single:
	docker-compose -f docker-compose.single.yml down

build-single:
	docker-compose -f docker-compose.single.yml build

# --- Shared library ---
build-shared:
	cd packages/shared && mvn clean install -DskipTests
