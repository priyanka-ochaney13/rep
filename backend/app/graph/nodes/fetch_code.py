import logging
import zipfile
import io
from app.models.state import RepoXState
from app.utils.github_api import download_repo_to_memory

logger = logging.getLogger(__name__)

def extract_zip_to_memory(zip_data: bytes) -> dict:
    """
    Extract ZIP file contents directly to memory (no temp files).
    
    Args:
        zip_data: Raw bytes of the ZIP file
        
    Returns:
        Dictionary mapping file paths to their contents
    """
    files_content = {}
    
    with zipfile.ZipFile(io.BytesIO(zip_data)) as zip_file:
        for file_info in zip_file.filelist:
            # Skip directories
            if file_info.is_dir():
                continue
            
            try:
                # Read file content
                content = zip_file.read(file_info.filename).decode('utf-8')
                files_content[file_info.filename] = content
            except UnicodeDecodeError:
                # Skip binary files
                logger.debug(f"Skipping binary file: {file_info.filename}")
                continue
            except Exception as e:
                logger.warning(f"Failed to read {file_info.filename}: {e}")
                continue
    
    logger.info(f"✓ Extracted {len(files_content)} text files from ZIP to memory")
    return files_content


def fetch_code(state: RepoXState) -> RepoXState:
    """
    Fetch code from GitHub or ZIP - ZERO local storage mode!
    Everything stays in memory - no temp files, no git clones, nothing on disk!
    """
    try:
        logger.info(f"[FETCH] Input type: {state.input_type}")
        logger.info(f"[FETCH] 🔒 ZERO LOCAL STORAGE MODE - All in-memory processing")

        # GitHub repository
        if state.input_type in ("github", "repo", "url"):
            logger.info(f"[FETCH] Fetching GitHub repo: {state.input_data}")
            logger.info("[FETCH] 🚀 Using GitHub API with in-memory storage")
            
            # Download directly to memory via GitHub API
            branch = state.branch if state.branch else "main"
            files_content = download_repo_to_memory(state.input_data, branch=branch)
            state.files_content = files_content
            logger.info(f"[FETCH] ✅ Loaded {len(files_content)} files into memory (ZERO disk usage!)")
            
        # ZIP file upload
        elif state.input_type == "zip":
            logger.info("[FETCH] 🚀 Extracting ZIP to memory (no temp files!)")
            
            # Assuming input_data is raw bytes or base64 string
            if isinstance(state.input_data, str):
                import base64
                zip_bytes = base64.b64decode(state.input_data)
            else:
                zip_bytes = state.input_data
            
            files_content = extract_zip_to_memory(zip_bytes)
            state.files_content = files_content
            logger.info(f"[FETCH] ✅ Extracted {len(files_content)} files to memory (ZERO disk usage!)")
            
        # Direct upload (already in memory)
        elif state.input_type == "upload":
            logger.info("[FETCH] ✅ Using uploaded data (already in memory)")
            # Assume input_data is already a dict of files
            if isinstance(state.input_data, dict):
                state.files_content = state.input_data
            else:
                raise ValueError("Upload input_data must be a dictionary of file contents")
            
        else:
            error_msg = f"Unsupported input_type: {state.input_type}. Use: github, repo, url, zip, or upload"
            logger.error(f"[FETCH] ✗ {error_msg}")
            raise ValueError(error_msg)
        
        logger.info(f"[FETCH] ✅ SUCCESS - All files in memory, ZERO local storage used!")
            
    except Exception as e:
        logger.error(f"[FETCH] ✗ Error: {str(e)}", exc_info=True)
        raise
        
    return state