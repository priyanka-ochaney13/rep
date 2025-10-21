"""
Project Analysis Node - Generates detailed file-by-file analysis with function highlights
"""
from app.models.state import DocGenState
from app.utils.mistral import get_llm_response_summary
import time
import random


def safe_llm_call(prompt: str, language: str, max_retries=5, base_wait=2.0):
    for attempt in range(max_retries):
        try:
            return get_llm_response_summary(prompt=prompt, language=language).strip()
        except Exception as e:
            wait_time = base_wait * (2 ** attempt) + random.uniform(0, 1)
            print(f"[Retry] LLM call failed on attempt {attempt+1}: {e}. Retrying in {wait_time:.1f}s...")
            time.sleep(wait_time)
    raise RuntimeError("LLM call failed after maximum retries.")


def analyze_project_structure(state: DocGenState) -> DocGenState:
    """
    Generate enhanced project analysis with:
    - Project structure tree
    - Detailed file summaries with function highlights
    """
    if not state.parsed_data:
        return state
    
    repo_data = state.parsed_data.get("repo_path", {})
    if not repo_data:
        return state
    
    # Generate project structure tree
    file_paths = sorted(repo_data.keys())
    structure_tree = build_structure_tree(file_paths)
    
    # Generate detailed analysis for each file
    detailed_analysis = {}
    
    for file_path, file_info in repo_data.items():
        try:
            code = file_info.get("code", "")
            language = file_info.get("type", "unknown")
            symbols = file_info.get("contains", [])
            
            # Skip non-code files (CSS, HTML, JSON, config files)
            if language in ("css", "scss", "sass", "less", "html", "json", "yaml", "yml"):
                print(f"[SKIP] Skipping non-code file ({language}): {file_path}")
                continue
            
            # Skip files with no meaningful code content
            if not code.strip() or len(code.strip()) < 50:
                print(f"[SKIP] Skipping empty/minimal file: {file_path}")
                continue
            
            # Skip files with no detected functions/classes (likely just config or data)
            if not symbols or len(symbols) == 0:
                print(f"[SKIP] Skipping file with no functions/classes: {file_path}")
                continue
            
            # Skip common config/build files by name
            filename = file_path.split('/')[-1].lower()
            skip_patterns = [
                'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
                'tsconfig', 'webpack', 'vite.config', 'babel', 'eslint',
                '.lock', '.min.js', '.bundle.js'
            ]
            if any(pattern in filename for pattern in skip_patterns):
                print(f"[SKIP] Skipping config/build file: {file_path}")
                continue
            
            # Create enhanced prompt for detailed analysis with Google-style documentation
            prompt = f"""You are a senior software engineer writing technical documentation following Google's documentation style guide.

Analyze this {language} file and provide clear, professional documentation in the following format:

**PURPOSE:**
Write 2-3 sentences in ACTIVE VOICE explaining:
1. What this file DOES (its primary function)
2. How it FITS into the overall application architecture
3. What problems it SOLVES

**KEY FUNCTIONS & COMPONENTS:**
For each major function, class, or component, document in this format:
- `function_name(param1, param2)` - INTERFACE: Accepts [parameters]. Returns [return value]. CONTRACT: [What it guarantees to do]. IMPLEMENTATION: [How it achieves this internally].

Example:
- `authenticate_user(email, password)` - INTERFACE: Accepts user credentials as strings. Returns JWT token string or raises AuthError. CONTRACT: Validates credentials against database and generates secure session token. IMPLEMENTATION: Uses bcrypt for password hashing, queries PostgreSQL user table, and generates JWT with 1-hour expiry.

**TECHNICAL DETAILS:**
List in bullet points using ACTIVE VOICE:
- [Design pattern] - Implements [pattern name] to [achieve specific goal]
- [Architecture] - Uses [technology/approach] to [solve specific problem]
- [Integration] - Connects with [external service/component] via [method]
- [API/Endpoints] - Exposes [HTTP method + path] that [specific action]
- [Data structures] - Defines [structure name] to [represent/manage specific data]

CRITICAL RULES:
✓ Use ACTIVE VOICE ("validates input" not "input is validated")
✓ Be CONCISE but COMPLETE - every sentence must add value
✓ Document the INTERFACE (how to use), CONTRACT (what it does), and IMPLEMENTATION (how it works)
✓ Focus on WHY and HOW, not just WHAT
✓ Write for developers who need to USE and UNDERSTAND this code
✓ Use present tense ("validates", "returns", "implements")
✓ Include specific details (parameter types, return values, error conditions)

Code to analyze:
```{language}
{code[:4000]}  # Increased limit for better analysis
```

Detected functions/classes: {', '.join(symbols[:10]) if symbols else 'None'}
"""
            
            response = safe_llm_call(prompt, language)
            
            # Parse the response
            parsed = parse_analysis_response(response, symbols)
            detailed_analysis[file_path] = {
                **parsed,
                "language": language,
                "symbols": symbols
            }
            
        except Exception as e:
            print(f"[Error] Failed analyzing {file_path}: {e}")
            detailed_analysis[file_path] = {
                "summary": "Analysis failed",
                "purpose": f"Error: {str(e)}",
                "functions": [],
                "key_details": []
            }
    
    # Store in state
    state.project_analysis = {
        "structure_tree": structure_tree,
        "detailed_analysis": detailed_analysis,
        "file_count": len(detailed_analysis),  # Count only analyzed files
        "total_files": len(file_paths),  # Total files in repo
        "languages": list(set(info.get("type", "unknown") for info in repo_data.values() if info.get("type") not in ["css", "scss", "sass", "less"]))
    }
    
    print(f"[ANALYSIS] Analyzed {len(detailed_analysis)} files out of {len(file_paths)} total files")
    
    return state


def build_structure_tree(file_paths: list) -> str:
    """
    Build a hierarchical visual tree structure from file paths.
    Only includes important source code files with logic (excludes HTML, CSS, JSON, configs).
    """
    # Filter out non-code files - only keep source code with logic
    excluded_extensions = (
        '.css', '.scss', '.sass', '.less',  # Styles
        '.html', '.htm',                      # Markup
        '.json', '.yaml', '.yml',             # Config data
        '.lock', '.md', '.txt',               # Docs/locks
        '.min.js', '.bundle.js'               # Minified
    )
    
    excluded_names = (
        'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
        'tsconfig.json', 'webpack.config', 'vite.config', 'babel.config',
        'eslint.config', '.gitignore', '.env'
    )
    
    def should_include(path):
        filename = path.split('/')[-1].lower()
        # Check extension
        if any(path.lower().endswith(ext) for ext in excluded_extensions):
            return False
        # Check filename patterns
        if any(pattern in filename for pattern in excluded_names):
            return False
        return True
    
    code_files = [path for path in file_paths if should_include(path)]
    
    if not code_files:
        return "📦 Repository Root/\n└── (No code files to display)"
    
    # Build nested directory structure
    tree_dict = {}
    
    for path in code_files:
        parts = path.split('/')
        current = tree_dict
        
        for i, part in enumerate(parts):
            if i == len(parts) - 1:  # It's a file
                if '_files' not in current:
                    current['_files'] = []
                current['_files'].append(part)
            else:  # It's a directory
                if part not in current:
                    current[part] = {}
                current = current[part]
    
    # Convert nested dict to visual tree string
    def dict_to_tree(d, prefix="", is_last=True):
        lines = []
        
        # Separate directories and files
        directories = [(k, v) for k, v in d.items() if k != '_files']
        files = d.get('_files', [])
        
        # Sort directories and files alphabetically
        directories.sort(key=lambda x: x[0])
        files.sort()
        
        # Process directories first
        for i, (dir_name, subdict) in enumerate(directories):
            is_last_dir = (i == len(directories) - 1) and not files
            connector = "└── " if is_last_dir else "├── "
            lines.append(f"{prefix}{connector}📁 {dir_name}/")
            
            # Add extension for nested items
            extension = "    " if is_last_dir else "│   "
            lines.extend(dict_to_tree(subdict, prefix + extension, is_last_dir))
        
        # Process files
        for i, filename in enumerate(files):
            is_last_file = i == len(files) - 1
            connector = "└── " if is_last_file else "├── "
            icon = get_file_icon(filename)
            lines.append(f"{prefix}{connector}{icon} {filename}")
        
        return lines
    
    # Build the tree
    tree_lines = ["📦 Repository Root/"]
    tree_lines.extend(dict_to_tree(tree_dict, ""))
    
    return "\n".join(tree_lines)


def get_file_icon(filename: str) -> str:
    """Get appropriate icon for file type"""
    if filename.endswith('.py'):
        return '🐍'
    elif filename.endswith(('.js', '.jsx')):
        return '📜'
    elif filename.endswith(('.ts', '.tsx')):
        return '📘'
    elif filename.endswith('.java'):
        return '☕'
    elif filename.endswith('.go'):
        return '🔵'
    elif filename.endswith(('.json', '.yaml', '.yml')):
        return '⚙️'
    elif filename.endswith(('.md', '.txt')):
        return '📄'
    elif filename.endswith(('.css', '.scss')):
        return '🎨'
    elif filename.endswith('.html'):
        return '🌐'
    else:
        return '📄'


def parse_analysis_response(response: str, symbols: list) -> dict:
    """
    Parse the LLM response into structured data
    """
    result = {
        "summary": "",
        "purpose": "",
        "functions": [],
        "key_details": []
    }
    
    # Split by sections
    sections = response.split("**")
    
    for i in range(len(sections)):
        section = sections[i].strip()
        
        if section.upper().startswith("PURPOSE:"):
            content = section.replace("PURPOSE:", "").strip()
            if i + 1 < len(sections):
                content = content.split("**")[0].strip()
            result["purpose"] = content
            result["summary"] = content  # Use purpose as summary
            
        elif section.upper().startswith("KEY FUNCTIONS:"):
            # Get content after this marker
            if i + 1 < len(sections):
                func_content = sections[i + 1] if i + 1 < len(sections) else ""
                # Look for next ** marker
                func_content = func_content.split("**")[0] if "**" in func_content else func_content
            else:
                func_content = section.replace("KEY FUNCTIONS:", "").strip()
            
            # Parse function lines
            lines = func_content.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('-') or line.startswith('*'):
                    # Remove leading markers
                    line = line.lstrip('-*').strip()
                    if line:
                        result["functions"].append(line)
            
        elif section.upper().startswith("TECHNICAL DETAILS:"):
            # Get content after this marker
            if i + 1 < len(sections):
                detail_content = sections[i + 1] if i + 1 < len(sections) else ""
                detail_content = detail_content.split("**")[0] if "**" in detail_content else detail_content
            else:
                detail_content = section.replace("TECHNICAL DETAILS:", "").strip()
            
            # Parse detail lines
            lines = detail_content.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('-') or line.startswith('*'):
                    line = line.lstrip('-*').strip()
                    if line:
                        result["key_details"].append(line)
    
    # Fallback: if parsing failed, use symbols
    if not result["functions"] and symbols:
        result["functions"] = [f"`{sym}()` - Function or class in this file" for sym in symbols[:5]]
    
    # Fallback: if no purpose, use generic
    if not result["purpose"]:
        result["purpose"] = "This file is part of the application codebase."
        result["summary"] = result["purpose"]
    
    return result
