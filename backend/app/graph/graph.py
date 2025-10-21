from typing import Dict, Any
import logging
from app.models.state import DocGenState
from app.graph.nodes.fetch_code import fetch_code
from app.graph.nodes.parse_code import parse_code
from app.graph.nodes.summarize_code import summarize_code_node
from app.graph.nodes.generate_readme import generate_readme
from app.graph.nodes.visualize_code import visualize_code_node
from app.graph.nodes.output_node import output_node

logger = logging.getLogger(__name__)


def summarize_only_node(state: DocGenState) -> DocGenState:
    repo_data = (state.parsed_data or {}).get("repo_path", {})
    for file_path in repo_data.keys():
        state.current_file_path = file_path
        state = summarize_code_node(state)
    return state


def run_pipeline(state: DocGenState) -> Dict[str, Any]:
    """Run a simple sequential pipeline and return a dict matching API expectations."""
    logger.info("=" * 60)
    logger.info("🚀 Starting Documentation Generation Pipeline")
    logger.info("=" * 60)
    
    # 1) Fetch code (from repo/zip/etc.)
    logger.info("📥 Step 1/6: Fetching code...")
    state = fetch_code(state)
    
    # 2) Parse code
    logger.info("🔍 Step 2/6: Parsing code structure...")
    state = parse_code(state)
    
    # 3) Summarize (no inline comments/docstrings)
    logger.info("📝 Step 3/6: Generating code summaries with AI...")
    state = summarize_only_node(state)
    
    # 4) Generate README
    logger.info("📄 Step 4/6: Generating README with AI...")
    state = generate_readme(state)
    
    # 5) Visualize structure
    logger.info("📊 Step 5/6: Creating visualizations...")
    state = visualize_code_node(state)
    
    # 6) Final output processing
    logger.info("✅ Step 6/6: Processing final output...")
    
    logger.info("=" * 60)
    logger.info("✨ Documentation Generation Complete!")
    logger.info("=" * 60)

    # Return the data from state object (before output_node converts it)
    return {
        "readme": state.readme or "",
        "summaries": state.summaries or {},
        "modified_files": state.modified_files or {},
        "visuals": state.visuals or {},
        "folder_tree": state.working_dir or "",
        "input_type": state.input_type,
    }