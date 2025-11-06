from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field

class RepoXPreferences(BaseModel):
    generate_summary: bool
    generate_readme: bool
    visualize_structure: bool

class RepoXState(BaseModel):
    input_type: str
    input_data: Union[str, Dict]
    current_file_path: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None
    summaries: Dict[str, str] = Field(default_factory=dict)
    modified_files: Dict[str, str] = Field(default_factory=dict)
    folder_tree: Optional[str] = None
    readme: Optional[str] = None
    visuals: Optional[Dict[str, str]] = None
    readme_summaries: Optional[List[Dict[str, Any]]] = None
    preferences: Optional[RepoXPreferences]
    branch: Optional[str] = None
    project_analysis: Optional[Dict[str, Any]] = None  # Project structure and detailed analysis
    files_content: Optional[Dict[str, str]] = None  # In-memory file content: {path: content}