# Use a Python image with uv pre-installed
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# Set working directory
WORKDIR /profiling

# Enable bytecode compilation and set link mode for uv
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Install git for installing dependencies from git repositories
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Create the virtual environment
RUN uv venv .venv

# Set environment variables to use the virtual environment
ENV VIRTUAL_ENV=/profiling/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install dependencies into the virtual environment using uv and the lockfile
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-dev

# Copy the rest of the application code
COPY . .

# Unbuffer Python output 
ENV PYTHONUNBUFFERED=1

# Start the FastAPI app with hot reload for development
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]