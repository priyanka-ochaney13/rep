from typing import Dict, Any
import logging
from app.models.state import RepoXState
from app.graph.nodes.fetch_code import fetch_code
from app.graph.nodes.parse_code_memory import parse_code_memory
from app.graph.nodes.summarize_code import summarize_code_node
from app.graph.nodes.generate_readme import generate_readme
from app.graph.nodes.visualize_code import visualize_code_node
from app.graph.nodes.analyze_project import analyze_project_structure
from app.graph.nodes.output_node import output_node

logger = logging.getLogger(__name__)


def summarize_only_node(state: RepoXState) -> RepoXState:
    repo_data = (state.parsed_data or {}).get("repo_path", {})
    for file_path in repo_data.keys():
        state.current_file_path = file_path
        state = summarize_code_node(state)
    return state


def run_pipeline(state: RepoXState) -> Dict[str, Any]:
    """Run a simple sequential pipeline and return a dict matching API expectations."""
    logger.info("=" * 60)
    logger.info("🚀 Starting Documentation Generation Pipeline")
    logger.info("🔒 ZERO LOCAL STORAGE MODE - Everything stays in memory!")
    logger.info("=" * 60)
    
    # 1) Fetch code (from repo/zip/etc.)
    logger.info("📥 Step 1/5: Fetching code...")
    state = fetch_code(state)
    
    # 2) Parse code - ALWAYS use in-memory parser (no temp files!)
    logger.info("🔍 Step 2/5: Parsing code structure...")
    if not hasattr(state, 'files_content') or not state.files_content:
        raise RuntimeError(
            "❌ ZERO STORAGE MODE ERROR: No in-memory files available!\n"
            "files_content is required for zero-storage mode."
        )
    
    logger.info("   ✨ Using in-memory parser (ZERO disk usage!)")
    state = parse_code_memory(state)
    
    # 3) Summarize (no inline comments/docstrings)
    logger.info("📝 Step 3/5: Generating code summaries with AI...")
    state = summarize_only_node(state)
    
    # 4) Generate README
    logger.info("📄 Step 4/5: Generating README with AI...")
    state = generate_readme(state)
    
    # 5) Visualize structure
    logger.info("📊 Step 5/5: Creating visualizations...")
    state = visualize_code_node(state)
    
    # 6) Analyze project structure
    logger.info("📋 Step 6/6: Generating detailed project analysis...")
    state = analyze_project_structure(state)
    
    # 7) Final output processing
    logger.info("✅ Final: Processing output...")
    
    logger.info("=" * 60)
    logger.info("✨ Documentation Generation Complete!")
    logger.info("🔒 ZERO files stored locally - all processing done in memory")
    logger.info("� Users can copy/download the README from the UI")
    logger.info("=" * 60)

    # Return the data from state object
    return {
        "readme": state.readme or "",
        "summaries": state.summaries or {},
        "modified_files": state.modified_files or {},
        "visuals": state.visuals or {},
        "folder_tree": {},  # No local paths to expose
        "input_type": state.input_type,
        "project_analysis": state.project_analysis,
    }