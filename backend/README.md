# RetinaGuard Clinical AI Backend

> **From detection to intervention.**  
> An AI-assisted diabetic retinopathy screening, longitudinal progression monitoring, clinical triage, referral pipeline, and patient recall platform.

---

## 🌟 Architectural Highlights

- **Django 5+ & Django REST Framework**: High performance, strictly modular, scalable healthcare API.
- **Provider-Agnostic AI Engine**:
  - `MockRetinalAIProvider`: Deterministic, clinically realistic fundus simulation with 5-stage DR classification, bounding boxes, and Grad-CAM overlays.
  - `LocalModelRetinalAIProvider`: Pluggable PyTorch/ONNX/TorchScript integration for production model weights.
  - `OpenCVImageQualityProvider`: Laplacian variance sharpness scoring, brightness histogram analysis, contrast RMS, and optical defect detection (`MOTION_BLUR`, `LOW_BRIGHTNESS`, `OFF_CENTER`).
- **Patient 360 Aggregation Service** (`GET /api/v1/patients/{id}/overview/`):
  - Fetches the patient's demographic record, diabetic history, latest AI analysis, findings, Grad-CAM overlays, composite risk score, longitudinal progression delta, active referral status, follow-up recall schedule, and consent records in a single database query.
- **Offline-First Synchronization with Idempotency** (`POST /api/v1/sync/`):
  - Dedicated endpoint for rural screening tablets with client-generated idempotency keys, duplicate replay handling, and conflict detection.
- **Dynamic Clinical Triage Ranking Engine** (`GET /api/v1/triage/`):
  - Composite prioritization based on AI disease severity, progression velocity, HbA1c elevation, and overdue recall days.
- **Automated Explainable AI (XAI)**:
  - Synthetic and gradient-based Grad-CAM heatmap generation with region-of-interest coordinate attribution.
- **Append-Only Regulatory Audit Trail**:
  - Captures every user authentication, record view, AI inference trigger, and referral state transition.
- **Interactive OpenAPI 3.0 / Swagger UI**: Live documentation available at `/api/docs/` and `/api/redoc/`.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    Client[Web & Mobile Clients / Field Tablets] -->|JWT Auth /api/v1/| Gateway[Django REST Framework API Gateway]
    
    subgraph Core Domain Apps
        Gateway --> Accounts[accounts: RBAC & Multi-Tenant Auth]
        Gateway --> Orgs[organizations: Hospital/PHC Scoping]
        Gateway --> Patients[patients: Patient 360 & Consents]
        Gateway --> Screenings[screenings: Encampments & Image Uploads]
        Gateway --> Triage[triage: Urgency Ranking Engine]
        Gateway --> Referrals[referrals: Tele-Ophthalmology Pipeline]
        Gateway --> Followups[followups: Multilingual Recall Radar]
        Gateway --> Sync[synchronization: Idempotent Batch Sync]
        Gateway --> Analytics[analytics: Population Health KPIs]
        Gateway --> Audit[audit: Immutable Regulatory Logs]
    end

    subgraph AI Platform Layer
        Screenings --> Pipeline[ScreeningPipelineService]
        Pipeline --> QC[ImageQualityProvider / OpenCV]
        Pipeline --> AI[RetinalAIProvider / DeepVision]
        Pipeline --> XAI[GradCAMService / Explainability]
        Pipeline --> Risk[RiskAssessmentService / 0-100 Score]
        Pipeline --> Prog[ProgressionService / Longitudinal Delta]
    end

    Pipeline --> DB[(PostgreSQL / SQLite Database)]
    Pipeline --> Storage[(Local / S3 Media Storage)]
```

---

## 🚀 Quickstart & Local Setup

### 1. Requirements
- Python 3.12+
- Virtualenv / Pip

### 2. Installation
```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file from the provided `.env.example`:
```ini
SECRET_KEY=retinaguard-super-secret-key-change-in-production-2026
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
# For PostgreSQL in production:
# DATABASE_URL=postgresql://retinaguard:password@localhost:5432/retinaguard_db
AI_PROVIDER=mock
DEMO_MODE=true
```

### 4. Database Migrations & Seed Data
```bash
# Run database migrations
python manage.py migrate

# Seed realistic clinical demonstration dataset
python manage.py seed_demo_data
```

### 5. Start Development Server
```bash
python manage.py runserver 8000
```
- API Base URL: `http://127.0.0.1:8000/api/v1/`
- Interactive Swagger UI: `http://127.0.0.1:8000/api/docs/`
- ReDoc UI: `http://127.0.0.1:8000/api/redoc/`
- Django Admin: `http://127.0.0.1:8000/admin/`

---

## 🔑 Pre-Seeded Demonstration Accounts

| Role | Email | Password | Purpose |
|---|---|---|---|
| **System Administrator** | `admin@retinaguard.ai` | `admin12345` | Global hospital network administration, audit logs |
| **Vitreoretinal Specialist** | `doctor.swaminathan@retinaguard.ai` | `doctor12345` | Specialist referral reviews, secondary consultations |
| **Healthcare Worker (ASHA)** | `asha.priya@retinaguard.ai` | `worker12345` | Rural health camps, patient registration, screening capture |

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/v1/auth/`)
- `POST /api/v1/auth/register/` - Register a new healthcare worker, doctor, or patient
- `POST /api/v1/auth/login/` - Authenticate with email/password, returns JWT tokens
- `POST /api/v1/auth/refresh/` - Refresh JWT access token
- `POST /api/v1/auth/logout/` - Invalidate session & blacklist refresh token
- `GET /api/v1/auth/me/` - Get current user profile and role

### 🏥 Organizations & Camps (`/api/v1/`)
- `GET /api/v1/organizations/` - List authorized healthcare facilities (Hospitals, PHCs, NGOs)
- `POST /api/v1/organizations/` - Create a new organization
- `GET /api/v1/camps/` - List rural screening camps
- `GET /api/v1/camps/{id}/statistics/` - Real-time camp progress, screening volume, high-risk yield

### 👤 Patients & Patient 360 (`/api/v1/patients/`)
- `GET /api/v1/patients/` - List and filter registered patients (`?risk=`, `?severity=`, `?search=`)
- `POST /api/v1/patients/` - Register a new patient
- `GET /api/v1/patients/{id}/` - Patient profile details
- `GET /api/v1/patients/{id}/overview/` - **Patient 360 Aggregated Overview** (demographics, latest AI, Grad-CAM, risk trajectory, referrals, follow-ups, consents)
- `GET /api/v1/patients/{id}/timeline/` - Chronological care continuum timeline events
- `GET /api/v1/patients/{id}/consents/` - Patient consent authorizations

### 🔬 Screenings & AI Pipeline (`/api/v1/screenings/`)
- `POST /api/v1/screenings/` - Initiate a screening encounter
- `GET /api/v1/screenings/{id}/` - Retrieve screening status
- `POST /api/v1/screenings/{id}/images/` - Upload 45° fundus photograph with optical QC
- `GET /api/v1/images/{id}/quality/` - Optical quality report (sharpness, brightness, motion blur detection)
- `POST /api/v1/screenings/{id}/analyze/` - Trigger AI inference pipeline (DR stage, findings, Grad-CAM, risk)
- `GET /api/v1/screenings/{id}/analysis/` - Retrieve AI analysis and lesion bounding boxes
- `GET /api/v1/screenings/{id}/comparison/` - **Longitudinal Scan Comparison** (previous vs current scan deltas)

### 🚨 Clinical Triage (`/api/v1/triage/`)
- `GET /api/v1/triage/` - Priority-ranked clinical triage queue (`?risk=`, `?severity=`, `?progression=`, `?sort_by=priority`)

### 📋 Referrals & Follow-ups (`/api/v1/`)
- `GET /api/v1/referrals/` - Specialist tele-ophthalmology referral queue
- `POST /api/v1/referrals/` - Dispatch specialist referral
- `PATCH /api/v1/referrals/{id}/` - Advance referral lifecycle status
- `GET /api/v1/followups/` - Recall radar queue (`?status=today`, `?status=overdue`)
- `POST /api/v1/followups/{id}/trigger_sms/` - Dispatch multilingual automated SMS recall

### 🔄 Offline Synchronization (`/api/v1/sync/`)
- `POST /api/v1/sync/` - Batch synchronization with guaranteed idempotency and conflict resolution

### 📊 Analytics & Reporting (`/api/v1/analytics/`)
- `GET /api/v1/analytics/dashboard/` - High-level KPIs (total screened, high risk, active referrals)
- `GET /api/v1/analytics/screenings/` - Daily screening volume and referral trends
- `GET /api/v1/analytics/severity/` - DR stage prevalence distribution
- `GET /api/v1/analytics/referrals/` - Referral breakdown by status, priority, and hospital
- `GET /api/v1/analytics/followups/` - Follow-up recall channel adherence

### 🔍 Global Search & Demo Scenarios (`/api/v1/`)
- `GET /api/v1/search/?q=` - Unified search across patients, screenings, and referrals
- `GET /api/v1/demo/scenarios/` - Pre-configured clinical demo scenarios (`healthy`, `moderate_dr`, `progression`, `poor_quality`, `offline_sync`)

---

## 🧪 Automated Testing

Execute the test suite using pytest:
```bash
python -m pytest
```
All 12 tests validate authentication, permissions, patient 360 aggregation, screening pipeline execution, optical quality assessment, triage ranking, referral progression, follow-up recall, offline synchronization idempotency, and analytics.

---

## 🐳 Docker Deployment

Run the entire RetinaGuard stack (Django API + PostgreSQL 16 + Redis + Celery worker) via Docker Compose:

```bash
docker compose up --build -d
```
The container will automatically apply migrations, seed demo data, and serve the API on port `8000`.
