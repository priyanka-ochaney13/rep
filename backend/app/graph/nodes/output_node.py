
from app.models.state import DocGenState


def output_node(state: DocGenState) -> dict:
    return {
        "modified_files": state.modified_files or {},
        "summaries": state.summaries or {},
        "readme": state.readme or "",
        "visuals": state.visuals or {},
        "folder_tree": state.working_dir or {},
        "input_type": state.input_type,
    }