.PHONY: help setup dev build test lint format docker-up docker-down migrate seed clean

help:
	@echo "Available commands:"
	@echo "  make setup        - Initial project setup"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build TypeScript"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Lint code"
	@echo "  make format       - Format code"
	@echo "  make docker-up    - Start Docker services (production)"
	@echo "  make docker-down  - Stop Docker services"
	@echo "  make migrate      - Run database migrations"
	@echo "  make seed         - Seed database with demo data"
	@echo "  make clean        - Clean build artifacts"

setup:
	@./scripts/setup.sh

dev:
	npm run dev

build:
	npm run build

test:
	npm test

lint:
	npm run lint

format:
	npm run format

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-dev-up:
	docker-compose -f docker-compose.dev.yml up -d

docker-dev-down:
	docker-compose -f docker-compose.dev.yml down

migrate:
	npm run prisma:migrate

seed:
	npm run seed

clean:
	rm -rf dist node_modules
