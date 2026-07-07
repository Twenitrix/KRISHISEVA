# KRISHISEVA — Backend MVP

Welcome to the backend service of **KRISHISEVA**, an AI-Powered Crop Insurance Claims Verification platform. It automates crop damage verification, parcel matching, fraud risk assessment, and payout calculations for smallholder farmers. This MVP is scoped to a single-village demo (Wardha) for **The Blueprint Ideathon 2026**.

---

## Technical Stack
* **Framework**: FastAPI (Asynchronous Python ASGI)
* **Database**: SQLite (local development / testing) / PostgreSQL 16 (production)
* **ORM**: SQLAlchemy 2.0 (fully async queries)
* **Migrations**: Alembic
* **Authentication**: JWT with access/refresh token rotation (OTP-based for Farmers via Mock Aadhaar, Password-based for NGOs and Government Officials)
* **AI Analysis**: NVIDIA NIM Catalog API (`meta/llama-3.2-11b-vision-instruct` VLM)
* **Testing**: pytest + pytest-asyncio + httpx

---

## Project Structure
```
backend/
├── app/
│   ├── core/           # Config, database connections, security helpers
│   ├── models/         # SQLAlchemy models (villages, claims, farmers, etc.)
│   ├── schemas/        # Pydantic validation request/response schemas
│   ├── repositories/   # Async CRUD repository layer matching SQLAlchemy models
│   ├── services/       # Domain logic: Auth, Claims Verification Pipeline
│   ├── ai/             # NVIDIA NIM Vision API integration
│   ├── routers/        # FastAPI endpoint routers (auth, claims, ngo, official)
│   ├── main.py         # App entrypoint, CORS configuration, exception handlers
│   └── exceptions.py   # Global custom exception hierarchy
├── seed/
│   └── seed_data.py    # Database seeder script for Wardha village demo
├── tests/
│   ├── conftest.py     # pytest fixtures (async database, test clients)
│   ├── test_auth.py    # Authentication integration tests
│   ├── test_claims.py  # Claim submission & verification pipeline tests
│   ├── test_ngo.py     # NGO verification flow tests
│   └── test_official.py# Government official dashboard & review tests
├── .env.example        # Environment variable template
└── requirements.txt    # Project dependencies
```

---

## Core Domain Features

### 1. Multi-Role Authentication
- **Farmers**: Login via OTP requested from a mock Aadhaar OTP system. Hashed Aadhaar values (SHA-256) are used for database matching to protect sensitive PII.
- **NGOs & Government Officials**: Secure login via email and password (hashed using `bcrypt`).
- **Token Security**: Standard JSON Web Tokens (JWT) are issued on login. Utilizes a secure refresh token rotation flow (valid for 7 days) to minimize credential exposure.

### 2. Async Claims Verification Pipeline (VP)
Upon claim submission, the system triggers an asynchronous background pipeline:
- **Image Metadata Extraction**: Validates EXIF coordinates and capture timestamps against submission inputs.
- **AI Vision Analysis**: Sends the uploaded crop photo to the NVIDIA NIM API to identify the crop type, estimate damage percentage, and provide justification.
- **GPS Boundary Scoring**: Cross-references photo coordinates with the land parcel coordinates to yield a distance/GPS matching score.
- **Crop Match Scoring**: Compares the AI-detected crop name against the crop on record in the Land Registry.
- **Fraud Risk Engine**: Scans for duplicate claims filed on the same parcel, checks history of past beneficiaries, and flags anomalies.
- **Payout Calculation**: If validated, suggests a payout based on the following formula:
  $$\text{Payout} = \min(\text{Damage \%} \times \text{Parcel Area} \times \text{Insured Sum Per Hectare}, \text{Maximum Cap})$$

---

## Local Setup & Run Instructions

### Prerequisites
* Python 3.12+
* (Optional) Docker & Docker Compose (for PostgreSQL)

### 1. Install Dependencies
Initialize a virtual environment and install the required Python packages:
```bash
python -m venv venv
venv\Scripts\activate   # On Windows
source venv/bin/activate # On Unix/macOS
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
copy .env.example .env
```
Ensure you provide a valid `NVIDIA_API_KEY` for AI features:
```env
NVIDIA_API_KEY="nvapi-..."
DATABASE_URL="sqlite+aiosqlite:///./krishiseva.db"
```

### 3. Initialize Database & Seed Demo Data
Run the seeding script to automatically configure database schema and seed demo records (village, farmers, officials, land registries, insured sums, and NGOs) inside SQLite:
```bash
python seed/seed_data.py
```

### 4. Start the Application
Launch the FastAPI development server:
```bash
uvicorn app.main:app --reload
```
You can view the interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.

---

## Running Integration Tests
The project features a comprehensive test suite covering all services, routers, and repositories. Mock fixtures are included for the NVIDIA API catalog.

To execute the test suite:
```bash
python -m pytest -v
```
All 13 integration tests should execute and pass successfully.
