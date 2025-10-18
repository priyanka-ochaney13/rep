from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field

class DocGenPreferences(BaseModel):
    generate_summary: bool
    generate_readme: bool
    visualize_structure: bool

class DocGenState(BaseModel):
    input_type: str
    input_data: Union[str, Dict]
    working_dir: Optional[Dict[str, str]] = None
    current_file_path: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None
    summaries: Dict[str, str] = Field(default_factory=dict)
    modified_files: Dict[str, str] = Field(default_factory=dict)
    folder_tree: Optional[str] = None
    readme: Optional[str] = None
    visuals: Optional[Dict[str, str]] = None
    readme_summaries: Optional[List[Dict[str, Any]]] = None
    preferences: Optional[DocGenPreferences]
    branch: Optional[str] = None