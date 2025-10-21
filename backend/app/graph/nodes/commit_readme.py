import os
import logging
from git import Repo, GitCommandError
from app.models.state import DocGenState

logger = logging.getLogger(__name__)


def commit_and_push_readme(state: DocGenState) -> DocGenState:
    """
    Commits the generated README.md to the cloned repository and pushes it to GitHub.
    Only works if input_type is 'github', 'repo', or 'url' and commit_to_github is enabled.
    """
    
    # Check if commit to GitHub is enabled
    if not state.preferences or not state.preferences.commit_to_github:
        logger.info("[COMMIT] Skipping commit - feature not enabled")
        state.commit_status = "skipped"
        state.commit_message = "Commit to GitHub not enabled"
        return state
    
    if state.input_type not in ("github", "repo", "url"):
        logger.info("[COMMIT] Skipping commit - not a GitHub repository")
        state.commit_status = "skipped"
        state.commit_message = "Not a GitHub repository"
        return state
    
    if not state.readme or state.readme.strip() == "":
        logger.warning("[COMMIT] No README content to commit")
        return state
    
    # Extract repo path from working_dir
    if isinstance(state.working_dir, dict):
        repo_path = state.working_dir.get("repo_path")
    else:
        repo_path = state.working_dir
    
    if not repo_path or not os.path.exists(repo_path):
        logger.error("[COMMIT] Repository path not found")
        return state
    
    try:
        logger.info(f"[COMMIT] Opening repository at: {repo_path}")
        repo = Repo(repo_path)
        
        # Write README.md to the repository
        readme_path = os.path.join(repo_path, "README.md")
        logger.info(f"[COMMIT] Writing README to: {readme_path}")
        
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(state.readme)
        
        # Check if there are changes to commit
        if repo.is_dirty(untracked_files=True):
            # Add README.md
            repo.index.add(["README.md"])
            
            # Commit
            commit_message = "docs: Auto-generate README.md with RepoX"
            logger.info(f"[COMMIT] Committing with message: {commit_message}")
            repo.index.commit(commit_message)
            
            # Push to remote
            logger.info("[COMMIT] Pushing to remote repository...")
            origin = repo.remote(name='origin')
            
            # Get current branch
            current_branch = repo.active_branch.name
            logger.info(f"[COMMIT] Pushing to branch: {current_branch}")
            
            # Push
            origin.push(refspec=f'{current_branch}:{current_branch}')
            
            logger.info("[COMMIT] ✓ Successfully pushed README.md to GitHub!")
            state.commit_status = "success"
            state.commit_message = f"README.md committed and pushed to {current_branch}"
            
        else:
            logger.info("[COMMIT] No changes detected - README already up to date")
            state.commit_status = "no_changes"
            state.commit_message = "README.md already exists and is up to date"
            
    except GitCommandError as e:
        error_msg = f"Git error: {str(e)}"
        logger.error(f"[COMMIT] {error_msg}")
        state.commit_status = "error"
        state.commit_message = error_msg
        
        # Check if it's an authentication issue
        if "authentication" in str(e).lower() or "permission" in str(e).lower():
            state.commit_message = "Authentication required - please configure Git credentials or use HTTPS with token"
            
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(f"[COMMIT] {error_msg}")
        state.commit_status = "error"
        state.commit_message = error_msg
    
    return state
