import random
import logging
from app.models.state import DocGenState
from app.utils.file_ops import clone_github_repo, extract_zip_file, git_clone_repo

logger = logging.getLogger(__name__)

def fetch_code(state: DocGenState) -> DocGenState:
    """Fetch code from GitHub, ZIP, or upload."""
    try:
        no = random.randint(1, 10000000)
        path = f"{no}"
        custom_clone_path = path

        logger.info(f"[FETCH] Input type: {state.input_type}")
        logger.info(f"[FETCH] Input data: {str(state.input_data)[:100]}...")

        # Accept 'github', 'repo', and 'url' as aliases for GitHub URL input
        if state.input_type in ("github", "repo", "url"):
            logger.info(f"[FETCH] Cloning GitHub repo: {state.input_data}")
            
            # If user wants to commit to GitHub, use git clone (preserves .git folder)
            # Otherwise use zip download (faster, no git credentials needed)
            if state.preferences and state.preferences.commit_to_github:
                logger.info("[FETCH] Using git clone (commit to GitHub enabled)")
                if state.branch:
                    state.working_dir = {"repo_path": git_clone_repo(state.input_data, custom_clone_path, branch=state.branch)}
                else:
                    state.working_dir = {"repo_path": git_clone_repo(state.input_data, custom_clone_path)}
            else:
                logger.info("[FETCH] Using zip download (faster, no git operations)")
                if state.branch:
                    state.working_dir = {"repo_path": clone_github_repo(state.input_data, custom_clone_path, branch=state.branch)}
                else:
                    state.working_dir = {"repo_path": clone_github_repo(state.input_data, custom_clone_path)}
            
            logger.info(f"[FETCH] ✓ Cloned successfully")
            
        elif state.input_type == "zip":
            logger.info("[FETCH] Extracting ZIP file")
            extracted_path = extract_zip_file(state.input_data, custom_clone_path)
            state.working_dir = {"repo_path": extracted_path}
            logger.info(f"[FETCH] ✓ Extracted successfully")
            
        elif state.input_type == "upload":
            state.working_dir = state.input_data
            logger.info("[FETCH] ✓ Using uploaded data")
        else:
            error_msg = f"Unsupported input_type: {state.input_type}. Use: github, repo, url, zip, or upload"
            logger.error(f"[FETCH] ✗ {error_msg}")
            raise ValueError(error_msg)
            
    except Exception as e:
        logger.error(f"[FETCH] ✗ Error: {str(e)}", exc_info=True)
        raise
        
    return state