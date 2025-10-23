"""
GitHub API utilities for fetching repository contents without cloning.
This module provides functions to interact with GitHub's REST API to:
- Fetch repository tree and file structure
- Download file contents directly
- Avoid local storage/cloning
"""

import os
import logging
import requests
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import base64
import tempfile

logger = logging.getLogger(__name__)


def parse_github_url(repo_url: str) -> Tuple[str, str]:
    """
    Parse GitHub URL to extract owner and repo name.
    
    Args:
        repo_url: GitHub repository URL (e.g., https://github.com/owner/repo)
    
    Returns:
        Tuple of (owner, repo_name)
    
    Raises:
        ValueError: If URL is not a valid GitHub URL
    """
    repo_url = repo_url.rstrip('/')
    
    if 'github.com' not in repo_url:
        raise ValueError("Not a valid GitHub URL")
    
    # Handle various GitHub URL formats
    # https://github.com/owner/repo
    # https://github.com/owner/repo.git
    # git@github.com:owner/repo.git
    
    if repo_url.startswith('git@github.com:'):
        # SSH format
        parts = repo_url.replace('git@github.com:', '').replace('.git', '').split('/')
    elif 'github.com/' in repo_url:
        # HTTPS format
        parts = repo_url.split('github.com/')[-1].replace('.git', '').split('/')
    else:
        raise ValueError("Could not parse GitHub URL")
    
    if len(parts) < 2:
        raise ValueError("Invalid GitHub URL format")
    
    owner = parts[0]
    repo = parts[1]
    
    return owner, repo


def get_github_token() -> Optional[str]:
    """
    Get GitHub token from environment variables.
    
    Returns:
        GitHub token or None if not set
    """
    return os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')


def fetch_repo_tree(owner: str, repo: str, branch: str = "main", token: Optional[str] = None) -> Dict:
    """
    Fetch the complete file tree of a GitHub repository using the Trees API.
    
    Args:
        owner: Repository owner
        repo: Repository name
        branch: Branch name (default: main)
        token: Optional GitHub token for authentication
    
    Returns:
        Dictionary containing the tree structure
    
    Raises:
        requests.HTTPError: If API request fails
        ValueError: If branch not found
    """
    # First, get the SHA of the branch
    headers = {'Accept': 'application/vnd.github.v3+json'}
    if token:
        headers['Authorization'] = f'token {token}'
    
    # Get branch info to get the commit SHA
    original_branch = branch
    branch_url = f'https://api.github.com/repos/{owner}/{repo}/branches/{branch}'
    
    logger.info(f"Fetching branch info from: {branch_url}")
    response = requests.get(branch_url, headers=headers, timeout=30)
    
    if response.status_code == 404:
        # Try alternative branches only if user didn't specify a custom branch
        # or if the specified branch is 'main' or 'master'
        should_try_alternatives = branch in ['main', 'master']
        
        if should_try_alternatives:
            for alt_branch in ['main', 'master', 'develop']:
                if alt_branch == branch:
                    continue
                logger.info(f"Branch '{branch}' not found, trying '{alt_branch}'...")
                branch_url = f'https://api.github.com/repos/{owner}/{repo}/branches/{alt_branch}'
                response = requests.get(branch_url, headers=headers, timeout=30)
                if response.ok:
                    branch = alt_branch
                    logger.info(f"✓ Using branch '{alt_branch}' instead")
                    break
        
        # If still 404, raise a clear error
        if response.status_code == 404:
            available_branches_msg = f"Branch '{original_branch}' not found in {owner}/{repo}. "
            available_branches_msg += "Please check the branch name and try again."
            logger.error(available_branches_msg)
            raise ValueError(available_branches_msg)
    
    # Check for other HTTP errors
    if response.status_code == 403:
        error_msg = "GitHub API rate limit exceeded. Please add a GITHUB_TOKEN environment variable or try again later."
        logger.error(error_msg)
        raise requests.HTTPError(error_msg)
    
    response.raise_for_status()
    branch_data = response.json()
    commit_sha = branch_data['commit']['sha']
    
    # Fetch the tree recursively
    tree_url = f'https://api.github.com/repos/{owner}/{repo}/git/trees/{commit_sha}?recursive=1'
    logger.info(f"Fetching repository tree from: {tree_url}")
    
    response = requests.get(tree_url, headers=headers, timeout=60)
    response.raise_for_status()
    
    tree_data = response.json()
    logger.info(f"✓ Fetched tree with {len(tree_data.get('tree', []))} items")
    
    return tree_data


def fetch_file_content(owner: str, repo: str, file_path: str, branch: str = "main", 
                       token: Optional[str] = None) -> Optional[str]:
    """
    Fetch the content of a specific file from GitHub.
    
    Args:
        owner: Repository owner
        repo: Repository name
        file_path: Path to the file in the repository
        branch: Branch name (default: main)
        token: Optional GitHub token for authentication
    
    Returns:
        File content as string, or None if file cannot be decoded
    
    Raises:
        requests.HTTPError: If API request fails
    """
    headers = {'Accept': 'application/vnd.github.v3+json'}
    if token:
        headers['Authorization'] = f'token {token}'
    
    # URL encode the file path
    import urllib.parse
    encoded_path = urllib.parse.quote(file_path, safe='')
    
    url = f'https://api.github.com/repos/{owner}/{repo}/contents/{encoded_path}?ref={branch}'
    
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    
    file_data = response.json()
    
    # Decode base64 content
    if 'content' in file_data:
        try:
            content = base64.b64decode(file_data['content']).decode('utf-8')
            return content
        except UnicodeDecodeError:
            logger.warning(f"Could not decode file as UTF-8: {file_path}")
            return None
    
    return None


def download_repo_to_memory(repo_url: str, branch: str = "main") -> Dict[str, str]:
    """
    Download repository files to an in-memory dictionary structure.
    
    Args:
        repo_url: GitHub repository URL
        branch: Branch name (default: main)
    
    Returns:
        Dictionary mapping file paths to their contents
        {
            'path/to/file.py': 'file content here',
            'README.md': '# Title\n...'
        }
    
    Raises:
        ValueError: If URL is invalid
        requests.HTTPError: If GitHub API request fails
    """
    owner, repo = parse_github_url(repo_url)
    token = get_github_token()
    
    logger.info(f"📥 Downloading repository: {owner}/{repo} (branch: {branch})")
    
    # Fetch the complete tree
    tree_data = fetch_repo_tree(owner, repo, branch, token)
    
    files_content = {}
    tree_items = tree_data.get('tree', [])
    
    # Filter only files (not directories)
    file_items = [item for item in tree_items if item['type'] == 'blob']
    
    logger.info(f"📦 Found {len(file_items)} files to download")
    
    # Download each file
    headers = {'Accept': 'application/vnd.github.v3+json'}
    if token:
        headers['Authorization'] = f'token {token}'
    
    for idx, item in enumerate(file_items, 1):
        file_path = item['path']
        
        # Skip binary files and common exclusions
        skip_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', 
                          '.tar', '.gz', '.exe', '.dll', '.so', '.dylib', '.bin'}
        if any(file_path.lower().endswith(ext) for ext in skip_extensions):
            logger.debug(f"Skipping binary file: {file_path}")
            continue
        
        # Skip large files (> 1MB via API)
        if item.get('size', 0) > 1_000_000:
            logger.debug(f"Skipping large file: {file_path} ({item['size']} bytes)")
            continue
        
        try:
            # Use the blob URL directly for better performance
            blob_url = item['url']
            response = requests.get(blob_url, headers=headers, timeout=30)
            response.raise_for_status()
            
            blob_data = response.json()
            
            # Decode content
            if blob_data.get('encoding') == 'base64' and 'content' in blob_data:
                try:
                    content = base64.b64decode(blob_data['content']).decode('utf-8')
                    files_content[file_path] = content
                    
                    if idx % 10 == 0:
                        logger.info(f"  Downloaded {idx}/{len(file_items)} files...")
                        
                except UnicodeDecodeError:
                    logger.debug(f"Could not decode as UTF-8: {file_path}")
                    
        except Exception as e:
            logger.warning(f"Failed to download {file_path}: {e}")
            continue
    
    logger.info(f"✅ Successfully downloaded {len(files_content)} text files")
    
    return files_content


def create_temp_directory_structure(files_content: Dict[str, str]) -> str:
    """
    Create a temporary directory structure from in-memory files.
    This is used as a compatibility layer for existing code that expects file paths.
    
    Args:
        files_content: Dictionary mapping file paths to contents
    
    Returns:
        Path to the temporary directory
    
    Note:
        The caller is responsible for cleaning up the temporary directory.
    """
    temp_dir = tempfile.mkdtemp(prefix='github_repo_')
    
    logger.info(f"📁 Creating temporary directory structure at: {temp_dir}")
    
    for file_path, content in files_content.items():
        full_path = Path(temp_dir) / file_path
        
        # Create parent directories
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write file content
        try:
            full_path.write_text(content, encoding='utf-8')
        except Exception as e:
            logger.warning(f"Failed to write file {file_path}: {e}")
    
    logger.info(f"✅ Created {len(files_content)} files in temporary directory")
    
    return temp_dir


def fetch_repo_without_clone(repo_url: str, branch: str = "main") -> str:
    """
    Fetch a GitHub repository without cloning it locally.
    Downloads files via API and creates a temporary directory structure.
    
    Args:
        repo_url: GitHub repository URL
        branch: Branch name (default: main)
    
    Returns:
        Path to temporary directory containing the repository files
    
    Note:
        The temporary directory should be cleaned up after use.
        Consider using this in a context manager or ensuring cleanup.
    """
    # Download all files to memory
    files_content = download_repo_to_memory(repo_url, branch)
    
    # Create temporary directory structure
    temp_dir = create_temp_directory_structure(files_content)
    
    return temp_dir
