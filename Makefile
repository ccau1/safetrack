.PHONY: up down build build-shared

up:
	docker-compose up --build -d

down:
	docker-compose down

build:
	docker-compose build

build-shared:
	cd packages/shared && mvn clean install -DskipTests
