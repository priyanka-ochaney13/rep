import shutil
import logging
from app.models.state import DocGenState

logger = logging.getLogger(__name__)


def output_node(state: DocGenState) -> dict:
    """
    Final output node that prepares the result and cleans up temporary resources.
    """
    # Cleanup temporary directory if it was created
    if state.temp_dir_cleanup:
        try:
            logger.info(f"[CLEANUP] Removing temporary directory: {state.temp_dir_cleanup}")
            shutil.rmtree(state.temp_dir_cleanup, ignore_errors=True)
            logger.info("[CLEANUP] ✓ Temporary directory cleaned up")
        except Exception as e:
            logger.warning(f"[CLEANUP] Failed to cleanup temporary directory: {e}")
    
    return {
        "modified_files": state.modified_files or {},
        "summaries": state.summaries or {},
        "readme": state.readme or "",
        "visuals": state.visuals or {},
        "folder_tree": state.working_dir or {},
        "input_type": state.input_type,
    }