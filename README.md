# ControlForge — Instrumentation & Control Engineering Platform

> **Measure. Model. Control. Automate.**

ControlForge is an engineering platform combining technical case studies, interactive process simulators, instrumentation calculators, engineering monographs, and predictive machine learning models.

---

## System Architecture

ControlForge is designed as a hybrid edge/server architecture:
1. **Frontend (Next.js 14 App Router)**:
   - Built with Next.js, React 18, TypeScript, and Tailwind CSS.
   - Houses the Phosphor & Brass design system.
   - Runs all real-time discrete PID loops, process simulators, and instrumentation calculators **100% client-side in the browser** (`lib/pid-math.ts`).
2. **Backend (FastAPI)**:
   - Standalone Python service in `/backend`.
   - Dedicated strictly to Stage 3 Industrial Intelligence & Machine Learning workloads (fault detection, RUL estimation, time-series forecasting).

---

## Local Development Setup

### 1. Frontend (Next.js)

Ensure Node.js (v18+) is installed.

```bash
# In the project root:
npm install

# Start development server on http://localhost:3000
npm run dev
```

### 2. Backend (FastAPI)

Ensure Python (3.11+) or `uv` is installed.

```bash
# Navigate to backend directory:
cd backend

# Create virtual environment (if not already created):
python -m venv .venv
# or using uv:
uv venv .venv

# Activate virtual environment:
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies:
pip install -r requirements.txt
# or using uv:
uv pip install -r requirements.txt

# Start FastAPI server on http://127.0.0.1:8000
uvicorn main:app --reload --port 8000
```

---

## API Documentation

When the FastAPI server is running, interactive Swagger docs are available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Endpoints Reference

| Method | Endpoint | Description | Sample Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status & timestamp | None |
| `POST` | `/api/predict/fault` | Time-series sensor fault detection | `{"readings": [49.8, 50.1, 55.4], "sensor_id": "PT-101"}` |
| `POST` | `/api/predict/rul` | Remaining Useful Life estimation | `{"sensor_id": "TT-201A", "vibration_rms": 2.4, "temperature_c": 74.2, "operating_hours": 3420.0}` |
| `POST` | `/api/forecast/temperature` | Autoregressive temperature projection | `{"historical_temperatures": [65.2, 65.8, 66.5], "horizon_steps": 10}` |

### Sample `curl` Requests

#### Health Check
```bash
curl -X GET http://127.0.0.1:8000/api/health
```

#### Fault Detection
```bash
curl -X POST http://127.0.0.1:8000/api/predict/fault \
  -H "Content-Type: application/json" \
  -d '{"readings": [49.8, 50.2, 50.1, 49.9, 50.0], "sensor_id": "PT-101"}'
```

#### Remaining Useful Life (RUL)
```bash
curl -X POST http://127.0.0.1:8000/api/predict/rul \
  -H "Content-Type: application/json" \
  -d '{"sensor_id": "TT-201A", "vibration_rms": 2.4, "temperature_c": 74.2, "operating_hours": 3420.0}'
```

#### Temperature Forecasting
```bash
curl -X POST http://127.0.0.1:8000/api/forecast/temperature \
  -H "Content-Type: application/json" \
  -d '{"historical_temperatures": [65.2, 65.8, 66.1, 66.5, 67.0], "horizon_steps": 10}'
```
