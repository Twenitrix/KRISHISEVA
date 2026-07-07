"""
KRISHISEVA — AI Vision Service.

Orchestrates communication with the NVIDIA API Catalog for crop damage photo analysis.
"""

import base64
import json
import logging
import mimetypes
import os
import re
from typing import Any, Optional

import httpx

from app.ai.client import NVIDIAClient
from app.ai.prompts import CROP_DAMAGE_SYSTEM_PROMPT, CROP_DAMAGE_USER_PROMPT

logger = logging.getLogger(__name__)


class AIService:
    """Service to handle agricultural vision-language processing tasks."""

    def __init__(self):
        self.client = NVIDIAClient()

    def _encode_image_to_base64(self, image_path: str) -> tuple[str, str]:
        """Reads local image and returns its base64 string and mime type."""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")

        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type:
            mime_type = "image/jpeg"

        with open(image_path, "rb") as image_file:
            encoded_bytes = base64.b64encode(image_file.read())
            base64_str = encoded_bytes.decode("utf-8")

        return base64_str, mime_type

    def _clean_json_response(self, text: str) -> dict[str, Any]:
        """Cleans and extracts JSON dictionary from LLM response text."""
        # Try raw parse first
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass

        # Try extracting from markdown json block: ```json ... ```
        block_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL | re.IGNORECASE)
        if block_match:
            try:
                return json.loads(block_match.group(1).strip())
            except json.JSONDecodeError:
                pass

        # Try extracting any curly braces
        braces_match = re.search(r"(\{.*\})", text, re.DOTALL)
        if braces_match:
            try:
                return json.loads(braces_match.group(1).strip())
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not parse valid JSON from AI response: {text}")

    async def analyze_claim_photo(self, image_path: str) -> dict[str, Any]:
        """
        Sends farmer's field photo to NVIDIA Vision API to identify crop and damage percentage.

        Returns:
            dict containing:
                - crop_identified (str)
                - damage_percentage (float)
                - justification (str)
        """
        logger.info(f"Analyzing claim photo: {image_path}")

        base64_str, mime_type = self._encode_image_to_base64(image_path)
        image_url = f"data:{mime_type};base64,{base64_str}"

        # Construct payload
        payload = {
            "model": self.client.default_model,
            "messages": [
                {
                    "role": "system",
                    "content": CROP_DAMAGE_SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": CROP_DAMAGE_USER_PROMPT
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 512,
            "temperature": 0.2
        }

        # Make HTTP request
        url = f"{self.client.base_url}/chat/completions"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=self.client.headers)
            
            if response.status_code != 200:
                logger.error(f"NVIDIA API Error: Status {response.status_code}, Body: {response.text}")
                raise httpx.HTTPStatusError(
                    f"NVIDIA API request failed with status code {response.status_code}",
                    request=response.request,
                    response=response
                )

            res_json = response.json()
            choices = res_json.get("choices", [])
            if not choices:
                raise ValueError("NVIDIA API returned empty completions choices")

            text_output = choices[0].get("message", {}).get("content", "")
            logger.info(f"Raw AI response: {text_output}")

            # Clean and parse the response into structured dict
            parsed = self._clean_json_response(text_output)
            
            # Post-parse validation to guarantee required fields are present and of correct types
            crop = parsed.get("crop_identified")
            damage = parsed.get("damage_percentage")
            justification = parsed.get("justification", "No justification provided by AI.")

            # Type coercion and validation
            if crop is not None:
                crop = str(crop).strip().lower()
            if damage is not None:
                try:
                    damage = float(damage)
                    damage = max(0.0, min(100.0, damage))
                except (TypeError, ValueError):
                    damage = None

            return {
                "crop_identified": crop,
                "damage_percentage": damage,
                "justification": justification
            }
