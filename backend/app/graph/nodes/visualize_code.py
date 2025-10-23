from app.models.state import DocGenState
from app.utils.mistral import get_llm_response_readme
from app.prompts.diagram_prompts import (
    SYSTEM_EXPLANATION_PROMPT,
    SYSTEM_MAPPING_PROMPT,
    SYSTEM_DIAGRAM_PROMPT
)
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
    # Check if we have parsed data (no need for working_dir anymore)
    if not state.parsed_data:
        return state

    repo_data = state.parsed_data.get("repo_path", {})
    file_paths = sorted(repo_data.keys())

    # Build file tree
    all_paths = set()
    for file_path in file_paths:
        parts = file_path.split("/")
        for i in range(1, len(parts)):
            folder = "/".join(parts[:i]) + "/"
            all_paths.add(folder)
        all_paths.add(file_path)

    folder_structure = "\n".join(sorted(all_paths))
    readme_content = state.readme or "No README available"

    print("🎨 Using GitDiagram-style 3-phase approach...")
    
    # Phase 1: Generate explanation
    print("📝 Phase 1: Generating architecture explanation...")
    explanation_prompt = f"""{SYSTEM_EXPLANATION_PROMPT}

<file_tree>
{folder_structure}
</file_tree>

<readme>
{readme_content}
</readme>"""

    try:
        explanation_response = safe_llm_call(explanation_prompt)
        
        # Extract explanation from tags
        explanation_start = explanation_response.find("<explanation>")
        explanation_end = explanation_response.find("</explanation>")
        
        if explanation_start != -1 and explanation_end != -1:
            explanation = explanation_response[explanation_start + 13:explanation_end].strip()
        else:
            explanation = explanation_response.strip()
        
        print(f"✅ Phase 1 complete. Explanation length: {len(explanation)} chars")
        
    except Exception as e:
        print(f"❌ Error in Phase 1: {e}")
        explanation = "System architecture explanation not available"
    
    # Phase 2: Map components to files
    print("�️  Phase 2: Mapping components to files...")
    mapping_prompt = f"""{SYSTEM_MAPPING_PROMPT}

<explanation>
{explanation}
</explanation>

<file_tree>
{folder_structure}
</file_tree>"""

    try:
        mapping_response = safe_llm_call(mapping_prompt)
        
        # Extract component mapping
        mapping_start = mapping_response.find("<component_mapping>")
        mapping_end = mapping_response.find("</component_mapping>")
        
        if mapping_start != -1 and mapping_end != -1:
            component_mapping = mapping_response[mapping_start:mapping_end + 20]
        else:
            component_mapping = mapping_response.strip()
        
        print(f"✅ Phase 2 complete. Mapping length: {len(component_mapping)} chars")
        
    except Exception as e:
        print(f"❌ Error in Phase 2: {e}")
        component_mapping = "<component_mapping>\n</component_mapping>"
    
    # Phase 3: Generate Mermaid diagram
    print("📊 Phase 3: Generating Mermaid diagram...")
    diagram_prompt = f"""{SYSTEM_DIAGRAM_PROMPT}

<explanation>
{explanation}
</explanation>

{component_mapping}"""

    try:
        mermaid_response = safe_llm_call(diagram_prompt)
        
        # Clean up the response
        mermaid_code = re.sub(r"<think>.*?</think>", "", mermaid_response, flags=re.DOTALL).strip()
        
        # Remove code fences if present
        mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "").strip()
        
        # Find diagram start
        patterns = ["flowchart TD", "flowchart LR", "flowchart TB", "graph TD", "graph LR"]
        diagram_start = -1
        
        for pattern in patterns:
            idx = mermaid_code.find(pattern)
            if idx != -1:
                diagram_start = idx
                break
        
        if diagram_start != -1:
            mermaid_code = mermaid_code[diagram_start:].strip()
        
        print(f"✅ Phase 3 complete. Diagram length: {len(mermaid_code)} chars")
        print("🎉 Diagram generation complete!")
        
    except Exception as e:
        print(f"❌ Error in Phase 3: {e}")
        # Fallback to simple diagram
        repo_name = state.input_data.split('/')[-1] if state.input_data else "Repository"
        mermaid_code = f"""flowchart TD
    Root["📦 {repo_name}"]
    Root --> Files["📄 Project Files"]
    Files --> Note["See file tree for details"]
    
    classDef default fill:#6366f1,stroke:#4f46e5,color:#fff"""

    state.visuals = state.visuals or {}
    state.visuals["folder_structure_mermaid"] = mermaid_code

    return state