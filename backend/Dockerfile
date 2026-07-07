# ──────────────────────────────────────────────
# KRISHISEVA Backend — Dockerfile
# Multi-stage build for production readiness
# ──────────────────────────────────────────────

FROM python:3.12-slim AS base

# Prevents Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ── Dependencies ──
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Application Code ──
COPY . .

# ── Create uploads directory ──
RUN mkdir -p /app/uploads

# ── Expose port ──
EXPOSE 8000

# ── Run ──
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
