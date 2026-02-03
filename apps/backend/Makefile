.PHONY: help build dev test test-coverage clean migrate-up migrate-down docker-build docker-run

help:
	@echo "Available commands:"
	@echo "  make build          - Build the application"
	@echo "  make dev            - Run in development mode with air"
	@echo "  make test           - Run tests"
	@echo "  make test-coverage  - Run tests with coverage"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make migrate-up     - Run database migrations (up)"
	@echo "  make migrate-down   - Rollback database migrations (down)"
	@echo "  make docker-build   - Build Docker image"
	@echo "  make docker-run     - Run Docker container"
	@echo "  make help           - Show this help message"

build:
	@echo "Building application..."
	go build -o backend ./cmd/server

dev:
	@echo "Running application in development mode..."
	air

test:
	@echo "Running tests..."
	go test -v ./tests/...

test-coverage:
	@echo "Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./tests/...
	go tool cover -html=coverage.out

clean:
	@echo "Cleaning build artifacts..."
	rm -f backend
	rm -f coverage.out
	rm -rf tmp/

migrate-up:
	@echo "Running migrations (up)..."
	migrate -path ./migrations -database "${DATABASE_URL}" up

migrate-down:
	@echo "Running migrations (down)..."
	migrate -path ./migrations -database "${DATABASE_URL}" down

docker-build:
	@echo "Building Docker image..."
	docker build -f Dockerfile.prod -t backend:latest .

docker-run:
	@echo "Running Docker container..."
	docker run -p 4000:4000 backend:latest

fmt:
	@echo "Formatting code..."
	go fmt ./...
	goimports -w .

lint:
	@echo "Running linter..."
	golangci-lint run

vet:
	@echo "Running go vet..."
	go vet ./...

deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy
