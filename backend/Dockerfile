# Use python:3.11-slim as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including curl for healthcheck
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source folders
COPY agents/ agents/
COPY orchestrator/ orchestrator/
COPY features/ features/
COPY synthetic_financial_gen/ synthetic_financial_gen/
COPY database/ database/
COPY data_sources/ data_sources/
COPY audit/ audit/
COPY data/ data/
COPY explainability/ explainability/
COPY evaluation/ evaluation/
COPY utils/ utils/
COPY out/ out/
COPY config.yaml .

# Copy .env file (will be overridden by docker-compose env_file)
COPY .env* ./

# Create necessary directories
RUN mkdir -p /app/out /app/audit

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "orchestrator.api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
