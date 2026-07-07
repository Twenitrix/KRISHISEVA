# CONTEXT.md — Project State Checkpoint
Generated after: Step 3
Date: 2026-07-07

## Project
Name: KRISHISEVA
Purpose: AI-Powered Crop Insurance Claims Verification MVP — one-village scope for The Blueprint Ideathon 2026 (PS2)
Stack: FastAPI + PostgreSQL + SQLAlchemy 2.0 (async) + Alembic + JWT + NVIDIA Vision API

## Decisions Locked In
- Auth: JWT, access=15min, refresh=7days, refresh token rotation on use
- Farmer auth: mock Aadhaar OTP (no email/password for farmers)
- NGO/Official auth: email + password (bcrypt via passlib)
- Aadhaar storage: masked (last 4 digits) + SHA-256 hash for lookup
- Password hashing: bcrypt via passlib
- All routes: /api/v1/ prefix
- Response format: { success, data, message, error, timestamp }
- Pagination: { items, total, page, per_page, pages }
- Soft deletes: is_deleted + deleted_at on all domain entities (BaseModel)
- Audit logs (ClaimStatusLog) and RefreshTokens use plain Base (no soft delete)
- UUID primary keys on all tables (gen_random_uuid() server default)
- File uploads: local disk (./uploads), max 10MB
- AI: NVIDIA API, single stateless vision call per claim, model meta/llama-4-maverick-17b-128e-instruct
- Naming: snake_case for files/vars/columns, PascalCase for classes
- Import style: absolute imports from app.*
- Layer boundaries: Router → Service → Repository → DB (never skip)
- All DB operations are async

## Files Created So Far
```
backend/
├── .env.example              # Env var template
├── .env                      # Local dev env (with real NVIDIA key)
├── .gitignore                # Python/Docker/IDE ignores
├── requirements.txt          # All Python dependencies
├── Dockerfile                # Single-stage dev build
├── docker-compose.yml        # Backend + PostgreSQL 16
├── alembic.ini               # Migration config
├── alembic/
│   ├── env.py                # Async migration runner, imports all models
│   ├── script.py.mako        # Migration file template
│   └── versions/.gitkeep
├── app/
│   ├── __init__.py
│   ├── main.py               # App factory, CORS, exception handlers, health
│   ├── exceptions.py         # Typed exception hierarchy (12 exception classes)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py         # Pydantic Settings singleton
│   │   └── database.py       # Async engine + session factory
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py           # Base, TimestampMixin, SoftDeleteMixin, BaseModel
│   │   ├── village.py        # 11 cols
│   │   ├── farmer.py         # 13 cols (Aadhaar hashed)
│   │   ├── ngo.py            # 12 cols
│   │   ├── official.py       # 12 cols
│   │   ├── land_registry.py  # 13 cols (polygon coords, crop on record)
│   │   ├── crop_insured_sum.py # 9 cols
│   │   ├── past_event.py     # 10 cols
│   │   ├── past_beneficiary.py # 10 cols
│   │   ├── claim.py          # 30 cols (full VP pipeline: AI + rules + payout)
│   │   ├── ngo_verification.py # 11 cols
│   │   ├── claim_status_log.py # 8 cols (immutable, plain Base)
│   │   └── refresh_token.py  # 6 cols (plain Base)
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── common.py         # APIResponse[T], PaginatedResponse[T]
│   └── repositories/
│       ├── __init__.py
│       ├── base_repository.py         # Generic CRUD + pagination + soft-delete
│       ├── farmer_repository.py       # Aadhaar hash, phone, village queries
│       ├── claim_repository.py        # Village stats, duplicate check, details
│       ├── ngo_repository.py          # NGO + NGOVerification repos
│       ├── official_repository.py     # Email lookup
│       ├── land_registry_repository.py # Farmer, village, survey queries
│       ├── reference_data_repository.py # Village, crop sums, events, beneficiaries
│       └── auth_repository.py         # Refresh tokens + status logs
```

## DB Schema (current — 12 tables)
- villages: id, name, district, state, taluka, latitude, longitude, is_deleted, deleted_at, created_at, updated_at
- farmers: id, village_id (FK), aadhaar_masked, aadhaar_hash, name, phone, bank_account_number, bank_ifsc, is_verified, is_deleted, deleted_at, created_at, updated_at
- ngos: id, name, license_number, contact_person, phone, email, hashed_password, is_active, is_deleted, deleted_at, created_at, updated_at
- officials: id, name, designation, email, hashed_password, phone, assigned_village_id (FK), is_active, is_deleted, deleted_at, created_at, updated_at
- land_registries: id, farmer_id (FK), village_id (FK), survey_number, area_hectares, crop_on_record, latitude, longitude, polygon_coords, is_deleted, deleted_at, created_at, updated_at
- crop_insured_sums: id, crop_name, insured_sum_per_hectare, season, year, is_deleted, deleted_at, created_at, updated_at
- past_events: id, village_id (FK), event_type, event_date, severity, description, is_deleted, deleted_at, created_at, updated_at
- past_beneficiaries: id, farmer_id (FK), event_id (FK), claim_amount, payout_amount, payout_date, is_deleted, deleted_at, created_at, updated_at
- claims: id, farmer_id, land_registry_id, village_id, photo_url, photo_latitude, photo_longitude, photo_timestamp, claimed_event_type, claimed_event_date, description, ai_identified_crop, ai_damage_percentage, ai_justification, ai_crop_matches_record, ai_call_status, gps_match_score, land_match_score, duplicate_check_result, fraud_flags, overall_score, suggested_payout_amount, official_approved_amount, status, reviewed_by_official_id, official_remarks, is_deleted, deleted_at, created_at, updated_at
- ngo_verifications: id, ngo_id, claim_id, farmer_id, photo_url, remarks, verification_type, is_deleted, deleted_at, created_at, updated_at
- claim_status_logs: id, claim_id, old_status, new_status, changed_by_role, changed_by_id, remarks, timestamp
- refresh_tokens: id, user_id, user_role, token, expires_at, created_at

## API Endpoints Built So Far
GET  /api/v1/health  ✅

## Steps Remaining
Step 4: Service layer (rule engine + payout calc + claim orchestration)
Step 5: Auth flow + MockForge Aadhaar
Step 6: Domain CRUD routers + Pydantic schemas
Step 7: AI service module (NVIDIA vision call)
Step 8: Seed data script
Step 9: Frontend connection prep (CORS, API docs)
Step 10: Test scaffold
Step 11: README.md

## How To Resume In A New Session
Paste this CONTEXT.md at the start of a new chat with this instruction:
"You are continuing to build KRISHISEVA. Here is the current state: [paste CONTEXT.md].
Continue from Step [N+1]. Follow the same patterns established so far."
