from typing import Dict, Any
from app.models.state import DocGenState
from app.graph.nodes.fetch_code import fetch_code
from app.graph.nodes.parse_code import parse_code
from app.graph.nodes.summarize_code import summarize_code_node
from app.graph.nodes.generate_readme import generate_readme
from app.graph.nodes.visualize_code import visualize_code_node
from app.graph.nodes.output_node import output_node


def summarize_only_node(state: DocGenState) -> DocGenState:
    repo_data = (state.parsed_data or {}).get("repo_path", {})
    for file_path in repo_data.keys():
        state.current_file_path = file_path
        state = summarize_code_node(state)
    return state


def run_pipeline(state: DocGenState) -> Dict[str, Any]:
    """Run a simple sequential pipeline and return a dict matching API expectations."""
    # 1) Fetch code (from repo/zip/etc.)
    state = fetch_code(state)
    # 2) Parse code
    state = parse_code(state)
    # 3) Summarize (no inline comments/docstrings)
    state = summarize_only_node(state)
    # 4) Generate README
    state = generate_readme(state)
    # 5) Visualize structure
    state = visualize_code_node(state)
    # 6) Final output processing
    state = output_node(state)

    return {
        "readme": getattr(state, "readme", None),
        "summaries": getattr(state, "summaries", {}),
        "modified_files": getattr(state, "modified_files", {}),
        "visuals": getattr(state, "visuals", None),
        "folder_tree": getattr(state, "folder_tree", None),
        "input_type": getattr(state, "input_type", None),
    }