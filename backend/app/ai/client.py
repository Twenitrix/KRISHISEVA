"""
KRISHISEVA — AI NVIDIA Client.

Configuration and request setup for the NVIDIA API Catalog.
"""

from app.core.config import settings


class NVIDIAClient:
    """Helper class to manage headers and configuration for the NVIDIA API Catalog."""

    def __init__(self):
        self.api_key = settings.nvidia_api_key
        self.base_url = "https://integrate.api.nvidia.com/v1"
        self.default_model = "meta/llama-3.2-11b-vision-instruct"

    @property
    def headers(self) -> dict[str, str]:
        """Request headers required by NVIDIA API Catalog."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
