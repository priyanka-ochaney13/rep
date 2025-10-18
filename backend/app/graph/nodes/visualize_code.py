from app.models.state import DocGenState
from app.utils.mistral import get_llm_response_readme
import re
import random
import time

def safe_llm_call(prompt: str, max_retries: int = 5, base_wait: float = 2.0) -> str:
    for attempt in range(max_retries):
        try:
            return get_llm_response_readme(prompt).strip()
        except Exception as e:
            wait_time = base_wait * (2 ** attempt) + random.uniform(0, 1)
            if "429" in str(e) or "rate limit" in str(e).lower():
                print(f"Rate limit or transient error. Retrying in {wait_time:.1f}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(wait_time)
            else:
                print(f"LLM call failed: {e}")
                raise
    raise RuntimeError("LLM call failed after maximum retries.")

def visualize_code_node(state: DocGenState) -> DocGenState:
    if not state.working_dir:
        return state

    repo_data = state.parsed_data.get("repo_path", {})
    file_paths = sorted(repo_data.keys())

    all_paths = set()
    for file_path in file_paths:
        parts = file_path.split("/")
        for i in range(1, len(parts)):
            folder = "/".join(parts[:i]) + "/"
            all_paths.add(folder)
        all_paths.add(file_path)

    folder_structure = "\n".join(sorted(all_paths))
    print("folder_structure:\n", folder_structure)

    prompt = f"""You are a precise and highly disciplined technical assistant.

Your task: Generate a Mermaid.js diagram using the `graph TD` syntax that exactly matches the folder structure given below.

Folder structure:
{folder_structure}

⚠️ Strict instructions:
- Do NOT add any reasoning steps, thought process, or "thinking" blocks.
- Do NOT invent or assume any extra folders or files.
- Only include items explicitly present in the list.
- Do NOT add any comments, explanation, or text before or after the diagram.
- Output ONLY valid Mermaid code, starting with `graph TD`.
- Use "Project_Root" as the root node label.
- For each folder or file, use **only alphanumeric characters, underscores, dots, hyphens, or slashes as they appear in the given paths**.
- Do NOT use reserved Mermaid keywords (e.g., `graph`, `subgraph`, `end`, `class`, etc.) as node names.
- If a file or folder name could conflict with Mermaid keywords, wrap the label in square brackets like `[graph/]`.

Format each node like this (example):
graph TD
    A[Project_Root] --> B[src/]
    B --> C[main.py]
    A --> D[README.md]

Now generate the Mermaid diagram strictly and correctly based on the provided paths."""

    try:
        raw_content = safe_llm_call(prompt)
    except Exception as e:
        print(f"Error generating Mermaid diagram: {e}")
        return state

    cleaned_content = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()

    mermaid_start = cleaned_content.find("graph TD")
    if mermaid_start != -1:
        mermaid_code = cleaned_content[mermaid_start:].strip()
    else:
        mermaid_code = cleaned_content

    mermaid_code = mermaid_code.replace("`", "")

    state.visuals = state.visuals or {}
    state.visuals["folder_structure_mermaid"] = mermaid_code

    return state