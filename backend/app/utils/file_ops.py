import os
import base64
import zipfile
import requests
from pathlib import Path
from typing import List

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