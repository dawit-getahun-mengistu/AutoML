# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the initial working directory in the container
WORKDIR /app

# Accept proxy settings as build arguments. This is crucial for
# building in corporate environments and keeps credentials out of the image.
ARG HTTP_PROXY
ARG HTTPS_PROXY

# Set environment variables for the proxy so that tools like apt and pip
# will use them during the build process.
ENV http_proxy=${HTTP_PROXY}
ENV https_proxy=${HTTPS_PROXY}

# Copy only the requirements file first to leverage Docker's layer caching.
# The next step will only re-run if requirements.txt changes.
COPY requirements.txt .

# Install system dependencies (git) and Python packages in a single layer.
# - Install git for pip to clone private repos.
# - Install Python packages from requirements.txt.
# - Clean up by removing git and the apt cache to keep the image small.
RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get purge -y --auto-remove git && \
    rm -rf /var/lib/apt/lists/*

# Copy the rest of the application source code into the container.
COPY . .

# Change the working directory to the source folder.
WORKDIR /app/src

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]