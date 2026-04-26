"""
core/gemini_client.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Shared Gemini API client factory.

Single place to init the Gemini client. All skill files import from here.
Reads GEMINI_API_KEY from environment (set in .env).
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging

logger = logging.getLogger("unmapped.gemini_client")

_client = None  # lazy singleton


def get_gemini_client():
    """
    Returns a configured google.generativeai module (acts as the client).
    Lazy-initialised — safe to import before env is loaded.
    """
    global _client
    if _client is not None:
        return _client

    try:
        import google.generativeai as genai
    except ImportError:
        raise RuntimeError(
            "google-generativeai not installed.\n"
            "Run: python -m pip install google-generativeai"
        )

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY not set.\n"
            "Add it to your .env file: GEMINI_API_KEY=your_key_here"
        )

    genai.configure(api_key=api_key)
    _client = genai
    logger.info("Gemini client initialised")
    return _client


def call_gemini(
    model_id: str,
    system_prompt: str,
    user_prompt: str,
    max_output_tokens: int = 1000,
    temperature: float = 0.2,
) -> str:
    """
    Thin wrapper around Gemini generate_content.
    Returns the text response as a string.
    Raises RuntimeError on failure (caller handles retries).
    """
    genai = get_gemini_client()

    generation_config = {
        "max_output_tokens": max_output_tokens,
        "temperature":       temperature,
    }

    model = genai.GenerativeModel(
        model_name        = model_id,
        system_instruction= system_prompt,
        generation_config = generation_config,
    )

    response = model.generate_content(user_prompt)

    if not response.text:
        raise RuntimeError("Gemini returned empty response")

    return response.text.strip()
