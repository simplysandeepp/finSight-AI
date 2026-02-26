# Use python:3.11-slim as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source folders
COPY agents/ agents/
COPY orchestrator/ orchestrator/
COPY features/ features/
COPY synthetic_financial_gen/ synthetic_financial_gen/
COPY out/ out/
COPY config.yaml .
COPY .env .

# Environment variables for API Keys
ENV GROQ_API_KEY_1=""
ENV GROQ_API_KEY_2=""
ENV GEMINI_API_KEY=""
ENV ALPHA_VANTAGE_API_KEY=""

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "orchestrator.api:app", "--host", "0.0.0.0", "--port", "8000"]
