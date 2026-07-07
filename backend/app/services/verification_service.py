"""
KRISHISEVA — Verification Service (Rule Engine).

All rule-based checks for the Verification Process (VP).
Each check is a simple pass/fail condition, listed in the Report
so the official can see exactly why a claim was flagged.

Checks:
1. GPS Match — photo coordinates vs land parcel coordinates
2. Land Coordinate Match — is the photo inside the parcel boundary?
3. Duplicate Check — has this farmer already filed on this parcel?
4. Fraud Detection — cross-reference with past beneficiary records
5. Crop Match — AI-identified crop vs crop on record (set by AI service)

This module ONLY does rule-based checks. AI calls are in ai/service.py.
"""

import math
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.claim_repository import ClaimRepository
from app.repositories.land_registry_repository import LandRegistryRepository
from app.repositories.reference_data_repository import PastBeneficiaryRepository


class VerificationService:
    """Rule engine for the Verification Process."""

    # GPS match threshold in meters — photo must be within 500m of parcel center
    GPS_MATCH_THRESHOLD_METERS = 500.0

    # Weights for computing the overall score (out of 100)
    WEIGHT_GPS = 30.0
    WEIGHT_LAND = 20.0
    WEIGHT_DUPLICATE = 25.0
    WEIGHT_AI_CROP_MATCH = 25.0

    def __init__(self, db: AsyncSession):
        self.db = db
        self.claim_repo = ClaimRepository(db)
        self.land_repo = LandRegistryRepository(db)
        self.past_ben_repo = PastBeneficiaryRepository(db)

    async def run_verification(
        self,
        claim_id: uuid.UUID,
        photo_lat: float | None,
        photo_lon: float | None,
        land_registry_id: uuid.UUID,
        farmer_id: uuid.UUID,
        ai_crop_matches: bool | None = None,
    ) -> dict[str, Any]:
        """
        Run all rule-based checks and compute the overall score.

        Returns a dict with all check results + overall_score.
        Called by ClaimService after the AI call completes.
        """
        land = await self.land_repo.get_by_id(land_registry_id)
        if not land:
            return self._build_result(
                gps_match=0.0, land_match=0.0,
                duplicate="error", fraud_flags=["Land registry not found"],
                score=0.0,
            )

        # 1. GPS Match
        gps_score = self._calculate_gps_match(
            photo_lat, photo_lon, land.latitude, land.longitude
        )

        # 2. Land Coordinate Match (polygon check if available, else use GPS)
        land_score = self._calculate_land_match(
            photo_lat, photo_lon, land.latitude, land.longitude,
            land.polygon_coords,
        )

        # 3. Duplicate Check
        has_duplicate = await self.claim_repo.check_duplicate(
            farmer_id, land_registry_id
        )
        duplicate_result = "duplicate_suspected" if has_duplicate else "clean"

        # 4. Fraud Detection
        fraud_flags = await self._check_fraud(farmer_id)

        # 5. Overall Score
        duplicate_score = 0.0 if has_duplicate else 1.0
        crop_match_score = 1.0 if ai_crop_matches else (0.0 if ai_crop_matches is False else 0.5)

        overall = (
            gps_score * self.WEIGHT_GPS
            + land_score * self.WEIGHT_LAND
            + duplicate_score * self.WEIGHT_DUPLICATE
            + crop_match_score * self.WEIGHT_AI_CROP_MATCH
        )

        # Penalty for fraud flags
        if fraud_flags:
            overall *= max(0.5, 1.0 - 0.1 * len(fraud_flags))

        return self._build_result(
            gps_match=round(gps_score, 4),
            land_match=round(land_score, 4),
            duplicate=duplicate_result,
            fraud_flags=fraud_flags,
            score=round(overall, 2),
        )

    def _calculate_gps_match(
        self,
        photo_lat: float | None,
        photo_lon: float | None,
        land_lat: float,
        land_lon: float,
    ) -> float:
        """
        Calculate GPS match score (0.0 to 1.0) using Haversine distance.
        1.0 = exact match, 0.0 = beyond threshold.
        """
        if photo_lat is None or photo_lon is None:
            return 0.0

        distance = self._haversine(photo_lat, photo_lon, land_lat, land_lon)

        if distance <= 50:
            return 1.0
        elif distance <= self.GPS_MATCH_THRESHOLD_METERS:
            return 1.0 - (distance / self.GPS_MATCH_THRESHOLD_METERS)
        else:
            return 0.0

    def _calculate_land_match(
        self,
        photo_lat: float | None,
        photo_lon: float | None,
        land_lat: float,
        land_lon: float,
        polygon_coords: dict | None,
    ) -> float:
        """
        Check if the photo was taken within the land parcel boundary.
        If polygon data is available, use point-in-polygon.
        Otherwise, fall back to simple proximity check.
        """
        if photo_lat is None or photo_lon is None:
            return 0.0

        if polygon_coords and "coordinates" in polygon_coords:
            # Simple ray-casting point-in-polygon
            return 1.0 if self._point_in_polygon(
                photo_lat, photo_lon, polygon_coords["coordinates"]
            ) else 0.0

        # Fallback: proximity check (same as GPS but stricter threshold)
        distance = self._haversine(photo_lat, photo_lon, land_lat, land_lon)
        if distance <= 200:
            return 1.0
        elif distance <= 500:
            return 0.5
        else:
            return 0.0

    async def _check_fraud(self, farmer_id: uuid.UUID) -> list[str]:
        """Check for potential fraud indicators."""
        flags = []

        # Check excessive past beneficiary claims
        past_count = await self.past_ben_repo.count_by_farmer(farmer_id)
        if past_count >= 5:
            flags.append(f"High past beneficiary count: {past_count} previous payouts")
        elif past_count >= 3:
            flags.append(f"Moderate past beneficiary count: {past_count} previous payouts")

        return flags

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance in meters between two GPS points using Haversine formula."""
        R = 6371000  # Earth's radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        d_phi = math.radians(lat2 - lat1)
        d_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(d_phi / 2) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @staticmethod
    def _point_in_polygon(lat: float, lon: float, polygon: list) -> bool:
        """
        Ray-casting point-in-polygon test.
        polygon: list of [lon, lat] coordinate pairs (GeoJSON format).
        """
        if not polygon or len(polygon) == 0:
            return False

        # Handle nested GeoJSON polygon (first ring is exterior)
        ring = polygon[0] if isinstance(polygon[0][0], list) else polygon

        n = len(ring)
        inside = False
        j = n - 1
        for i in range(n):
            xi, yi = ring[i][1], ring[i][0]  # GeoJSON: [lon, lat]
            xj, yj = ring[j][1], ring[j][0]
            if ((yi > lon) != (yj > lon)) and (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi):
                inside = not inside
            j = i
        return inside

    @staticmethod
    def _build_result(
        gps_match: float,
        land_match: float,
        duplicate: str,
        fraud_flags: list[str],
        score: float,
    ) -> dict[str, Any]:
        """Build the verification result dict."""
        return {
            "gps_match_score": gps_match,
            "land_match_score": land_match,
            "duplicate_check_result": duplicate,
            "fraud_flags": fraud_flags,
            "overall_score": score,
        }
