from app.models.state import RepoXState
from app.utils.mistral import get_llm_response_summary
import re
import time
import random

CHUNK_SIZE = 300
CHUNK_OVERLAP = 10

def split_code_into_chunks(code: str, lines_per_chunk=CHUNK_SIZE, overlap=CHUNK_OVERLAP) -> list[str]:
    lines = code.splitlines()
    chunks = []
    for i in range(0, len(lines), lines_per_chunk - overlap):
        chunk = "\n".join(lines[i:i + lines_per_chunk])
        chunks.append(chunk)
    return chunks

def parse_llm_summary_response(response: str) -> list[dict]:
    lines = [
        line.strip("- ").strip()
        for line in response.strip().splitlines()
        if line.strip().startswith("-")
    ]
    structured = []
    for line in lines:
        match = re.match(r"([\w_]+)\s*[:\-–]\s*(.+)", line)
        if match:
            symbol, summary = match.groups()
            structured.append({"symbol": symbol.strip(), "summary": summary.strip()})
        else:
            structured.append({"symbol": None, "summary": line})
    return structured

def safe_llm_call(prompt: str, language: str, max_retries=5, base_wait=2.0):
    for attempt in range(max_retries):
        try:
            print("summarizing")
            sum = get_llm_response_summary(prompt=prompt, language=language)
            print(sum)
            return sum.strip()
        except Exception as e:
            print(e)
            wait_time = base_wait * (2 ** attempt) + random.uniform(0, 1)
            print(f"[Retry] LLM call failed on attempt {attempt+1}: {e}. Retrying in {wait_time:.1f}s...")
            time.sleep(wait_time)
    raise RuntimeError("LLM call failed after maximum retries.")

def summarize_code_node(state: RepoXState) -> RepoXState:
    if not state.preferences.generate_summary or not state.parsed_data:
        return state

    file_path = state.current_file_path
    file_info = state.parsed_data["repo_path"][file_path]

    file_code = file_info.get("code", "")
    language = file_info.get("type", "text")
    symbols = file_info.get("contains", [])

    if not file_code.strip():
        return state

    chunks = split_code_into_chunks(file_code)
    all_structured_summaries = []

    for chunk in chunks:
        prompt = (
            f"Analyze the following {language} source file carefully for README documentation purposes. "
            f"Write a concise technical summary (2-4 sentences) that includes: "
            f"1) The file's primary purpose and functionality "
            f"2) Key classes/functions and their roles (only the most important ones) "
            f"3) How this file contributes to the overall application "
            f"4) Any notable implementation details, algorithms, or patterns used "
            f"5) **All** API endpoints, routes, or public interfaces if present (with HTTP methods and paths) "
            f"Focus on information that would help developers understand this component's role in the codebase. "
            f"Do NOT list every function - only highlight core functionality that defines what this file does. "
            f"If this file contains API routes, endpoints, or public interfaces, mention them specifically. "
            f"Keep it technical but accessible for README documentation.\n\n"
            f"### Code:\n{chunk.strip()}"
        )
        try:
            response = safe_llm_call(prompt, language)
            print(f"[LLM RAW RESPONSE for {file_path}]:\n{response}\n{'-' * 50}")
            structured = parse_llm_summary_response(response)
            all_structured_summaries.extend(structured)
        except Exception as e:
            print(f"[Error] Failed summarizing chunk in {file_path} even after retries: {e}")

    combined_summary = " ".join([s['summary'] for s in all_structured_summaries if s['summary']]).strip()

    if not state.readme_summaries:
        state.readme_summaries = []

    state.readme_summaries = [
        s for s in state.readme_summaries if s["file"] != file_path
    ]

    state.readme_summaries.append({
        "file": file_path,
        "summary": combined_summary if combined_summary else "No summary available.",
        "type": language,
        "contains": symbols
    })

    state.summaries[file_path] = combined_summary

    return state