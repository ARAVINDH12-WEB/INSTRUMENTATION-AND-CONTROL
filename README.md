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
| `POST` | `/api/forecast/energy` | Multi-method energy load forecast (Holt-Winters, seasonal) | `{"horizon_steps": 24, "baseline_kw": 450.0}` |
| `POST` | `/api/predict/fault/benchmark` | Multi-class fault confusion matrix benchmark | None (URL params: `seed=42&count_per_class=50`) |

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

---

## Automated CI/CD Quality Gates

ControlForge enforces automated validation via GitHub Actions on every push and pull request targeting `main`.

### 1. Workflows Overview

| Workflow | Path | Target Scope | Key Verification Steps |
| :--- | :--- | :--- | :--- |
| **Frontend CI** | `.github/workflows/frontend.yml` | Next.js app, simulators, calculators | `npm ci`, `npm run typecheck`, `npm run build`, `npm run test:frontend` |
| **Backend CI** | `.github/workflows/backend.yml` | FastAPI analytics & ML service | `pip install`, `pytest backend/test_endpoints.py -v` |

### 2. Running Local Quality Gates

Run the exact test suites executed by CI before opening a pull request:

```bash
# 1. Typecheck the entire TypeScript codebase:
npm run typecheck

# 2. Run the frontend math regression, cascade, and KB test suites:
npm run test:frontend

# 3. Validate static site generation across all 33 routes:
npm run build

# 4. In a Python environment, run the backend endpoint test suite:
cd backend
pytest test_endpoints.py -v
```

### 3. Branch Protection Setup (GitHub Repository Settings)

To guarantee that code cannot merge into `main` without passing these automated gates, configure branch protection in GitHub:

1. In GitHub, navigate to **Settings** → **Branches**.
2. Under **Branch protection rules**, click **Add branch ruleset** or **Add rule**.
3. Set **Branch name pattern** to `main`.
4. Enable the following settings:
   - **Require a pull request before merging** (Require approvals: 1).
   - **Require status checks to pass before merging**:
     - Check **Require branches to be up to date before merging**.
     - In the status checks search box, select:
       - `Frontend Build & Math Regression Gate` (from `Frontend CI`)
       - `Backend API & ML Prediction Tests` (from `Backend CI`)
   - **Require conversation resolution before merging**.
   - **Do not allow bypassing the above settings** (enforces checks for administrators).
5. Click **Save changes**. Merge commits and direct pushes to `main` without passing CI will now be blocked automatically.

