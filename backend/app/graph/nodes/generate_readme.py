import os
import re
import time
import random
from app.models.state import DocGenState
from app.utils.mistral import get_llm_response_readme

def clean_llm_markdown_response(raw_response: str) -> str:
    cleaned = re.sub(r"<think>.*?</think>", "", raw_response, flags=re.DOTALL).strip()
    cleaned = re.sub(r"^```(?:markdown)?\n?", "", cleaned)
    cleaned = re.sub(r"\n?```$", "", cleaned)
    return cleaned.strip()

def safe_llm_call(callable_fn, prompt: str, retries: int = 5, base_delay: int = 5) -> str:
    for attempt in range(1, retries + 1):
        try:
            return callable_fn(prompt).strip()
        except Exception as e:
            if "429" in str(e):
                delay = base_delay * (2 ** (attempt - 1)) + random.uniform(0, 3)
                print(f"[429 Rate Limit] Retrying in {delay:.1f}s... (Attempt {attempt}/{retries})")
                time.sleep(delay)
            else:
                print(f"[LLM Error] {e}")
                raise
    raise Exception("Max retries exceeded for LLM call")

def chunk_summaries(summaries, max_chars=6000):
    chunks = []
    current_chunk = []
    current_len = 0

    for s in summaries:
        s_len = len(s)
        if current_len + s_len > max_chars:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [s]
            current_len = s_len
        else:
            current_chunk.append(s)
            current_len += s_len

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks

def generate_readme(state: DocGenState) -> DocGenState:
    print("Inside readme")

    if not state.preferences.generate_readme:
        return state

    folder_structure = "\n".join(sorted(state.working_dir.keys())) if state.working_dir else "Not Available"
    summaries_section = []

    if state.readme_summaries and isinstance(state.readme_summaries, list):
        for item in state.readme_summaries:
            file = item.get("file", "unknown")
            summary = item.get("summary", "No summary available.")
            ftype = item.get("type", "unknown")
            contains = item.get("contains", [])

            lines = [f"#### `{file}` ({ftype})"]
            lines.append(f"- Summary: {summary}")
            if contains:
                lines.append(f"- Contains: {', '.join(contains)}")

            summaries_section.append("\n".join(lines))

    chunks = chunk_summaries(summaries_section, max_chars=6000)

    partial_code_summaries = []
    for chunk_text in chunks:
        partial_prompt = f"""
You are an expert technical writer.

Generate only a **Code Summary** section in markdown based on these summaries. Do not include any other sections, no title, no folder structure. Only return the "Code Summary" section.

---
{chunk_text}
---
"""
        partial_summary_md = safe_llm_call(get_llm_response_readme, partial_prompt)
        cleaned_partial = clean_llm_markdown_response(partial_summary_md)
        partial_code_summaries.append(cleaned_partial)

    merged_code_summary = "\n\n".join(partial_code_summaries)

    final_prompt = f"""
You are an expert technical writer. Generate professional README.md documentation.

*CODEBASE:*
📁 Folder Structure: {folder_structure}
📄 Code Summaries: {merged_code_summary}

*GENERATE THESE SECTIONS:*

# 1. PROJECT OVERVIEW
- H1 title based on actual code content
- What the project does and main purpose
- Key features from code summaries
- Tech stack used

# 2. ARCHITECTURE 
- Project structure and main components
- How components interact
- Directory organization

# 3. TECHNICAL DETAILS
- *Core Components* - main app logic
- *Supporting Modules* - utilities, helpers
- *Configuration* - config files, setup
- *Additional Features* - extras, integrations

# 4. API REFERENCE (if APIs exist)
- Endpoints and purpose
- Request/response formats

# 5. SETUP & USAGE
- Installation steps
- How to run/build
- Basic usage examples

*RULES:*
- Use only info from provided summaries
- Add emojis to section headers
- Skip sections not applicable to codebase
- Output plain Markdown only
- Be factual and developer-focused
"""

    try:
        final_readme_raw = safe_llm_call(get_llm_response_readme, final_prompt)
        final_readme_clean = clean_llm_markdown_response(final_readme_raw).replace("\\n", "\n")
        print("Generated README:\n", final_readme_clean)
        state.readme = final_readme_clean.strip()
    except Exception as e:
        print(f"[Error] Failed to generate README: {e}")
        state.readme = ""

    return state