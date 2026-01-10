.PHONY: build run docker-build docker-push docker-run clean deps

# Install dependencies
deps:
	pip install -r requirements.txt

# Run the application locally
run:
	python app.py

# Build Docker image
docker-build:
	docker build -t expense-tracker:latest .

# Push to DockerHub
docker-push:
	docker tag expense-tracker:latest batubaba619/expense-tracker:latest
	docker push batubaba619/expense-tracker:latest

# Run with Docker Compose
docker-run:
	docker-compose up -d

# Clean build artifacts
clean:
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	rm -rf data/

