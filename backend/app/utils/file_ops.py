import os
import base64
import zipfile
import requests
import logging
from pathlib import Path
from typing import List
from git import Repo, GitCommandError

logger = logging.getLogger(__name__)

def _base_tmp_dir() -> str:
    # Place temp under project to avoid permission issues on Windows
    base = Path(__file__).resolve().parents[3] / ".ClonedRepos"
    base.mkdir(parents=True, exist_ok=True)
    return str(base)


def clone_github_repo(repo_url: str, repo_id: str, branch: str = "main") -> str:
    """Download a GitHub repo as a zip and extract it.

    Tries the requested branch first, then falls back to 'main' and 'master'
    if the requested branch doesn't exist. Raises an HTTP error if all attempts fail.
    """
    temp_dir = os.path.join(_base_tmp_dir(), repo_id)
    os.makedirs(temp_dir, exist_ok=True)
    zip_path = os.path.join(temp_dir, "repo.zip")

    attempts: List[str] = []
    if branch:
        attempts.append(branch)
    for fb in ("main", "master"):
        if fb not in attempts:
            attempts.append(fb)

    last_status = None
    last_url = None
    for br in attempts:
        zip_url = repo_url.rstrip("/") + f"/archive/refs/heads/{br}.zip"
        last_url = zip_url
        resp = requests.get(zip_url, timeout=60)
        last_status = resp.status_code
        if resp.ok:
            with open(zip_path, "wb") as f:
                f.write(resp.content)
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(temp_dir)
            break
    else:
        # All attempts failed
        raise requests.HTTPError(
            f"Failed to download GitHub branch zip. Last URL: {last_url}, status: {last_status}"
        )
    extracted_folder_name = os.listdir(temp_dir)
    extracted_folder_name = [name for name in extracted_folder_name if os.path.isdir(os.path.join(temp_dir, name)) and name != "__MACOSX"]
    if extracted_folder_name:
        extracted_path = os.path.join(temp_dir, extracted_folder_name[0])
        return extracted_path
    else:
        return temp_dir


def git_clone_repo(repo_url: str, repo_id: str, branch: str = "main") -> str:
    """
    Actually clone a GitHub repository using git clone.
    This preserves the .git folder so commits can be made.
    
    Args:
        repo_url: The GitHub repository URL (e.g., https://github.com/user/repo)
        repo_id: Unique identifier for this clone
        branch: Branch to checkout (defaults to 'main')
    
    Returns:
        Path to the cloned repository
    """
    temp_dir = os.path.join(_base_tmp_dir(), repo_id)
    
    # If directory already exists and has .git, assume it's cloned
    if os.path.exists(temp_dir) and os.path.exists(os.path.join(temp_dir, ".git")):
        logger.info(f"Repository already cloned at {temp_dir}, pulling latest changes...")
        try:
            repo = Repo(temp_dir)
            origin = repo.remote(name='origin')
            origin.pull()
            logger.info("✓ Successfully pulled latest changes")
            return temp_dir
        except Exception as e:
            logger.warning(f"Failed to pull updates: {e}. Will re-clone...")
            # If pull fails, delete and re-clone
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
    
    # Clone the repository
    logger.info(f"Cloning repository from {repo_url} to {temp_dir}...")
    
    try:
        # Clone with the specified branch
        repo = Repo.clone_from(repo_url, temp_dir, branch=branch)
        logger.info(f"✓ Successfully cloned repository (branch: {branch})")
        return temp_dir
    except GitCommandError as e:
        # If specified branch fails, try main
        if branch != "main":
            logger.info(f"Branch '{branch}' not found, trying 'main'...")
            try:
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                repo = Repo.clone_from(repo_url, temp_dir, branch="main")
                logger.info("✓ Successfully cloned repository (branch: main)")
                return temp_dir
            except GitCommandError:
                pass
        
        # If main fails, try master
        logger.info("Trying 'master' branch...")
        try:
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
            repo = Repo.clone_from(repo_url, temp_dir, branch="master")
            logger.info("✓ Successfully cloned repository (branch: master)")
            return temp_dir
        except GitCommandError as final_error:
            logger.error(f"Failed to clone repository: {final_error}")
            raise Exception(f"Failed to clone repository with branches: {branch}, main, master. Error: {str(final_error)}")

def extract_zip_file(base64_data: str, dest_dir: str) -> str:
    base_temp_dir = os.path.join(_base_tmp_dir(), dest_dir)
    os.makedirs(base_temp_dir, exist_ok=True)
    zip_data = base64.b64decode(base64_data)
    zip_path = os.path.join(base_temp_dir, "code.zip")
    with open(zip_path, "wb") as f:
        f.write(zip_data)
    extract_path = os.path.join(base_temp_dir, "extracted")
    os.makedirs(extract_path, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
    return extract_path