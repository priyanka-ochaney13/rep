import logging
from app.models.state import DocGenState

logger = logging.getLogger(__name__)


def output_node(state: DocGenState) -> dict:
    """
    Final output node that prepares the result.
    NOTE: No cleanup needed - we never create temp files in zero-storage mode!
    """
    
    # Store only the source URL - no local paths ever
    folder_tree_data = {}
    if state.input_type in ("github", "repo", "url") and state.input_data:
        folder_tree_data = {"source_url": state.input_data}
    elif state.input_type == "zip":
        folder_tree_data = {"source": "zip_upload"}
    # For 'upload' type, don't store any path info
    
    return {
        "modified_files": state.modified_files or {},
        "summaries": state.summaries or {},
        "readme": state.readme or "",
        "visuals": state.visuals or {},
        "folder_tree": folder_tree_data,
        "input_type": state.input_type,
    }