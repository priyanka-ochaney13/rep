"""
GitHub change detection utilities.
Detects if a repository has new commits or changes since last documentation generation.
"""

import logging
import requests
from typing import Dict, Optional, Tuple, Any
from app.utils.github_api import parse_github_url, get_github_token

logger = logging.getLogger(__name__)


def get_latest_commit_sha(owner: str, repo: str, branch: str = "main", 
                          token: Optional[str] = None) -> Optional[str]:
    """
    Get the SHA of the latest commit on a specific branch.
    
    Args:
        owner: Repository owner
        repo: Repository name
        branch: Branch name (default: main)
        token: Optional GitHub token for authentication
    
    Returns:
        Latest commit SHA or None if failed
    """
    headers = {'Accept': 'application/vnd.github.v3+json'}
    if token:
        headers['Authorization'] = f'token {token}'
    
    url = f'https://api.github.com/repos/{owner}/{repo}/branches/{branch}'
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 404:
            # Try alternative branches
            for alt_branch in ['main', 'master', 'develop']:
                if alt_branch == branch:
                    continue
                url = f'https://api.github.com/repos/{owner}/{repo}/branches/{alt_branch}'
                response = requests.get(url, headers=headers, timeout=30)
                if response.ok:
                    branch = alt_branch
                    break
        
        response.raise_for_status()
        branch_data = response.json()
        return branch_data['commit']['sha']
        
    except Exception as e:
        logger.error(f"Failed to get latest commit SHA: {e}")
        return None


def check_repo_updates(repo_url: str, last_commit_sha: Optional[str], 
                       branch: str = "main") -> Dict[str, Any]:
    """
    Check if a repository has updates since the last documentation generation.
    
    Args:
        repo_url: GitHub repository URL
        last_commit_sha: SHA of the commit when docs were last generated
        branch: Branch name to check (default: main)
    
    Returns:
        Dict with update information:
        {
            'has_updates': bool,
            'latest_sha': str,
            'last_sha': str,
            'commits_behind': int,
            'error': str (if any)
        }
    """
    try:
        owner, repo = parse_github_url(repo_url)
        token = get_github_token()
        
        # Get latest commit SHA
        latest_sha = get_latest_commit_sha(owner, repo, branch, token)
        
        if not latest_sha:
            return {
                'has_updates': False,
                'error': 'Could not fetch latest commit',
                'latest_sha': None,
                'last_sha': last_commit_sha
            }
        
        # If no previous commit SHA, consider as having updates
        if not last_commit_sha:
            return {
                'has_updates': True,
                'latest_sha': latest_sha,
                'last_sha': None,
                'commits_behind': None,
                'message': 'No previous commit tracked'
            }
        
        # Check if SHAs are different
        has_updates = latest_sha != last_commit_sha
        
        # Get commit count between last and latest
        commits_behind = 0
        if has_updates:
            commits_behind = get_commits_between(owner, repo, last_commit_sha, 
                                                 latest_sha, branch, token)
        
        return {
            'has_updates': has_updates,
            'latest_sha': latest_sha,
            'last_sha': last_commit_sha,
            'commits_behind': commits_behind,
            'message': f'{commits_behind} new commits' if has_updates else 'Up to date'
        }
        
    except Exception as e:
        logger.error(f"Error checking repo updates: {e}")
        return {
            'has_updates': False,
            'error': str(e),
            'latest_sha': None,
            'last_sha': last_commit_sha
        }


def get_commits_between(owner: str, repo: str, base_sha: str, head_sha: str,
                       branch: str = "main", token: Optional[str] = None) -> int:
    """
    Get the number of commits between two SHAs.
    
    Args:
        owner: Repository owner
        repo: Repository name
        base_sha: Base commit SHA
        head_sha: Head commit SHA
        branch: Branch name
        token: Optional GitHub token
    
    Returns:
        Number of commits between base and head
    """
    headers = {'Accept': 'application/vnd.github.v3+json'}
    if token:
        headers['Authorization'] = f'token {token}'
    
    url = f'https://api.github.com/repos/{owner}/{repo}/compare/{base_sha}...{head_sha}'
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        commits_count = data.get('total_commits', 0)
        
        return commits_count
        
    except Exception as e:
        logger.warning(f"Could not get commits count: {e}")
        return 0


def get_latest_commit_info(repo_url: str, branch: str = "main") -> Dict[str, Any]:
    """
    Get detailed information about the latest commit.
    
    Args:
        repo_url: GitHub repository URL
        branch: Branch name (default: main)
    
    Returns:
        Dict with commit information including SHA, message, author, date
    """
    try:
        owner, repo = parse_github_url(repo_url)
        token = get_github_token()
        
        headers = {'Accept': 'application/vnd.github.v3+json'}
        if token:
            headers['Authorization'] = f'token {token}'
        
        # Get branch info with commit details
        url = f'https://api.github.com/repos/{owner}/{repo}/branches/{branch}'
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 404:
            # Try alternatives
            for alt_branch in ['main', 'master', 'develop']:
                if alt_branch == branch:
                    continue
                url = f'https://api.github.com/repos/{owner}/{repo}/branches/{alt_branch}'
                response = requests.get(url, headers=headers, timeout=30)
                if response.ok:
                    branch = alt_branch
                    break
        
        response.raise_for_status()
        branch_data = response.json()
        
        commit = branch_data['commit']
        
        return {
            'sha': commit['sha'],
            'message': commit['commit']['message'],
            'author': commit['commit']['author']['name'],
            'date': commit['commit']['author']['date'],
            'url': commit['html_url']
        }
        
    except Exception as e:
        logger.error(f"Failed to get latest commit info: {e}")
        return {
            'error': str(e)
        }
