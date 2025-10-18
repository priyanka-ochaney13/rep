import random
from app.models.state import DocGenState
from app.utils.file_ops import clone_github_repo, extract_zip_file

def fetch_code(state: DocGenState) -> DocGenState:
    no = random.randint(1, 10000000)
    path = f"{no}"
    custom_clone_path = path

    # Accept both 'github' and 'repo' as aliases for GitHub URL input
    if state.input_type in ("github", "repo"):
        if state.branch:
            state.working_dir = {"repo_path": clone_github_repo(state.input_data, custom_clone_path, branch=state.branch)}
        else:
            state.working_dir = {"repo_path": clone_github_repo(state.input_data, custom_clone_path)}
    elif state.input_type == "zip":
        extracted_path = extract_zip_file(state.input_data, custom_clone_path)
        state.working_dir = {"repo_path": extracted_path}
    elif state.input_type == "upload":
        state.working_dir = state.input_data
    else:
        raise ValueError(f"Unsupported input_type: {state.input_type}")

    return state