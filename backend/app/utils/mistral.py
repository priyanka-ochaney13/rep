"""LLM utilities with graceful fallback.

If LangChain (and providers) are not installed, we fall back to
deterministic, local string generation so the backend runs without
external dependencies or API keys.
"""

from typing import Optional
import os

# Try to load .env if python-dotenv is present; otherwise skip silently
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

_USE_FAKE: bool = False

try:
    # New unified API in recent LangChain releases
    from langchain.chat_models import init_chat_model  # type: ignore
    from langchain_core.output_parsers import StrOutputParser  # type: ignore

    # Initialize models only if env keys are likely present; otherwise fall back
    # (these providers require their own API keys configured via env)
    llm_readme = init_chat_model(
        model="llama-3.3-70b-versatile",
        model_provider="groq",
        temperature=0.1,
    )

    llm_summary = init_chat_model(
        model="codestral-2405",
        model_provider="mistralai",
        temperature=0.5,
    )

    _parser = StrOutputParser()

    def _invoke_llm(model, prompt: str, system: str) -> str:
        messages = [("system", system), ("user", prompt)]
        chain = model | StrOutputParser()  # parse to string
        return chain.invoke(messages)

except Exception:
    # LangChain not available or model init failed — use local fallback
    _USE_FAKE = True
    llm_readme = None  # type: ignore
    llm_summary = None  # type: ignore
    _parser = None  # type: ignore

    def _invoke_llm(model, prompt: str, system: str) -> str:  # type: ignore
        # Deterministic placeholder output so the app remains functional
        system_tag = system.split(" ")[0].strip().lower()
        snippet = (prompt or "").strip().replace("\r", " ").replace("\n", " ")
        return f"[{system_tag}] {snippet[:280]}"  # keep it short


def get_llm_response_summary(prompt: str, language: str) -> str:
    system = (
        f"You are a highly skilled senior {language} software engineer. "
        f"Always write precise, technical, and concise output without adding explanations or extra commentary."
    )
    return _invoke_llm(llm_summary, prompt, system)


def get_llm_response_readme(prompt: str) -> str:
    system = (
        "You are a technical writer and documentation specialist. "
        "You create clean, professional, and well-structured Markdown documentation. "
        "Always be concise, precise, and avoid adding any extra commentary or text."
    )
    return _invoke_llm(llm_readme, prompt, system)
