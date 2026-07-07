import json
import os
import random
from datetime import datetime, timezone
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Mock Aadhaar (UIDAI) Service")

# CORS middleware to allow requests from anywhere during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-Memory State ──
class MockState:
    def __init__(self):
        self.users: Dict[str, dict] = {}
        self.active_otps: Dict[str, str] = {}
        self.logs: List[dict] = []
        self.scenarios: Dict[str, bool] = {
            "service_down": False,
            "rate_limited": False,
            "always_fail_otp": False,
            "timeout": False
        }
        self.load_seed()

    def load_seed(self):
        try:
            with open("seed.json", "r") as f:
                data = json.load(f)
                self.users = {u["aadhaar_number"]: u for u in data["users"]}
        except Exception as e:
            print(f"Error loading seed: {e}")
            # Fallback hardcoded users
            self.users = {
                "123456789012": {"aadhaar_number": "123456789012", "phone": "9876543210", "name": "Ramesh Kumar", "status": "active"}
            }

    def log_request(self, method: str, endpoint: str, status_code: int, details: str):
        self.logs.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "method": method,
            "endpoint": endpoint,
            "status_code": status_code,
            "details": details
        })
        # Keep logs at max 100 entries
        if len(self.logs) > 100:
            self.logs.pop(0)

state = MockState()

# Mount static files if directory exists
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ── Schemas ──
class OTPRequest(BaseModel):
    aadhaar_number: str

class OTPVerify(BaseModel):
    aadhaar_number: str
    otp: str

class ScenarioToggle(BaseModel):
    scenario: str
    enabled: bool

# ── Impersonator UI Root ──
@app.get("/", response_class=HTMLResponse)
async def serve_impersonator():
    """Serves the UIDAI / DigiLocker lookalike login page."""
    try:
        with open("static/index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>UIDAI Impersonator (Static files not found yet)</h1>")

@app.get("/mockforge", response_class=HTMLResponse)
async def serve_dashboard():
    """Serves the MockForge developer control panel."""
    try:
        with open("static/dashboard.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>MockForge Admin Dashboard (Static files not found yet)</h1>")

# ── API Endpoints ──
@app.post("/aadhaar/request-otp")
async def request_otp(payload: OTPRequest):
    # Scenario check: Service Down
    if state.scenarios["service_down"]:
        state.log_request("POST", "/aadhaar/request-otp", 503, "Service down scenario active")
        raise HTTPException(status_code=503, detail="UIDAI service temporarily unavailable")

    aadhaar = payload.aadhaar_number
    if len(aadhaar) != 12 or not aadhaar.isdigit():
        state.log_request("POST", "/aadhaar/request-otp", 400, f"Invalid Aadhaar format: {aadhaar}")
        raise HTTPException(status_code=400, detail="Invalid Aadhaar number format")

    user = state.users.get(aadhaar)
    if not user:
        state.log_request("POST", "/aadhaar/request-otp", 404, f"Aadhaar not found: {aadhaar}")
        raise HTTPException(status_code=404, detail="Aadhaar number not registered")

    if user["status"] == "suspended":
        state.log_request("POST", "/aadhaar/request-otp", 403, f"Suspended Aadhaar: {aadhaar}")
        raise HTTPException(status_code=403, detail="Aadhaar status is suspended/inactive")

    # Generate mock OTP
    otp = str(random.randint(100000, 999999))
    # Standardize OTP for dev to make testing easier
    otp = "123456"
    state.active_otps[aadhaar] = otp

    masked_phone = f"XXXX-XXX-{user['phone'][-4:]}"
    details = f"OTP requested for {user['name']}. Masked phone: {masked_phone}. OTP sent: {otp}"
    state.log_request("POST", "/aadhaar/request-otp", 200, details)

    return {
        "success": True,
        "message": "OTP sent successfully to registered mobile number",
        "otp_sent_to": masked_phone,
        "mock_otp": otp # Returned for easy testing
    }

@app.post("/aadhaar/verify-otp")
async def verify_otp(payload: OTPVerify):
    if state.scenarios["service_down"]:
        state.log_request("POST", "/aadhaar/verify-otp", 503, "Service down scenario active")
        raise HTTPException(status_code=503, detail="UIDAI service temporarily unavailable")

    aadhaar = payload.aadhaar_number
    otp = payload.otp

    user = state.users.get(aadhaar)
    if not user:
        state.log_request("POST", "/aadhaar/verify-otp", 404, f"Verification failed. Aadhaar not found: {aadhaar}")
        raise HTTPException(status_code=404, detail="Aadhaar number not registered")

    saved_otp = state.active_otps.get(aadhaar)
    
    # Check scenarios
    always_fail = state.scenarios["always_fail_otp"]
    
    if always_fail or not saved_otp or otp != saved_otp:
        state.log_request("POST", "/aadhaar/verify-otp", 400, f"Failed OTP verification for Aadhaar: {aadhaar}. Provided: {otp}")
        raise HTTPException(status_code=400, detail="Invalid OTP or OTP expired")

    # Success: delete the OTP
    del state.active_otps[aadhaar]
    
    # Generate SHA-256 hash of Aadhaar to simulate secure callback payload
    import hashlib
    aadhaar_hash = hashlib.sha256(aadhaar.encode()).hexdigest()

    state.log_request("POST", "/aadhaar/verify-otp", 200, f"OTP verified successfully for {user['name']}")
    return {
        "success": True,
        "message": "OTP verified successfully",
        "farmer_details": {
            "name": user["name"],
            "phone": user["phone"],
            "aadhaar_masked": aadhaar[-4:],
            "aadhaar_hash": aadhaar_hash
        }
    }

# ── Admin API Endpoints ──
@app.get("/admin/logs")
async def get_logs():
    return {"logs": state.logs}

@app.post("/admin/reset")
async def reset_state():
    state.active_otps.clear()
    state.logs.clear()
    for k in state.scenarios:
        state.scenarios[k] = False
    state.log_request("POST", "/admin/reset", 200, "Mock state reset to defaults")
    return {"success": True, "message": "State reset successfully"}

@app.post("/admin/scenario")
async def toggle_scenario(payload: ScenarioToggle):
    if payload.scenario in state.scenarios:
        state.scenarios[payload.scenario] = payload.enabled
        state.log_request("POST", "/admin/scenario", 200, f"Scenario '{payload.scenario}' set to {payload.enabled}")
        return {"success": True, "message": f"Scenario '{payload.scenario}' updated"}
    raise HTTPException(status_code=404, detail="Scenario not found")

@app.get("/admin/scenarios")
async def get_scenarios():
    return state.scenarios
