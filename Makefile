.PHONY: help up down logs clean build restart

help:
	@echo "BadSession - Badminton Team Management"
	@echo ""
	@echo "Available commands:"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - View container logs"
	@echo "  make build       - Build Docker images"
	@echo "  make restart     - Restart all services"
	@echo "  make clean       - Clean up containers and volumes"

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

build:
	docker-compose build

restart:
	docker-compose restart

clean:
	docker-compose down -v
	docker system prune -f

install-deps:
	cd server && npm install
	cd ../web && npm install

dev-server:
	cd server && npm run dev

dev-web:
	cd web && npm run dev
