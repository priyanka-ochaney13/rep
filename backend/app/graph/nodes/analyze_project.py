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
    
    # Generate detailed analysis for each file
    file_paths = sorted(repo_data.keys())
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
⚠️ ONLY include functions/classes that you can MEANINGFULLY explain with specific details about their purpose, parameters, and implementation.
⚠️ DO NOT list functions just because they exist - skip them if you cannot provide substantial technical insight.
⚠️ Quality over quantity - 2-3 well-documented functions are better than 10 vague descriptions.

For each major function/class that you CAN explain well, document in this format:
- `function_name(param1, param2)` - Accepts [specific parameter types and purpose]. Returns [specific return type and meaning]. Implements [specific algorithm/pattern/approach] to achieve [concrete goal]. Example: Handles [specific scenario or use case].

ONLY document functions where you can answer ALL of these:
1. What specific inputs does it take and what do they represent?
2. What specific output does it produce?
3. What concrete problem does it solve or what specific action does it perform?
4. How does it achieve this (algorithm, pattern, technique)?

If you cannot answer all 4 questions with specifics, DO NOT include that function.

**TECHNICAL DETAILS:**
List in bullet points using ACTIVE VOICE - focus on architecture, patterns, and design decisions:
- [Design pattern] - Implements [specific pattern name] to [achieve concrete goal]
- [Architecture] - Uses [specific technology/approach] to [solve specific problem]
- [Integration] - Connects with [specific external service/component] via [specific method/protocol]
- [API/Endpoints] - Exposes [specific HTTP method + path] that [performs specific action]
- [Data structures] - Defines [specific structure name] to [represent/manage specific data type]

CRITICAL RULES:
✓ Use ACTIVE VOICE ("validates input" not "input is validated")
✓ Be CONCISE but COMPLETE - every sentence must add value
✓ SKIP functions you cannot explain with technical depth
✓ Focus on WHY and HOW, not just WHAT
✓ Write for developers who need to USE and UNDERSTAND this code
✓ Use present tense ("validates", "returns", "implements")
✓ Include specific details (parameter types, return values, error conditions)
✓ It's OK to have NO functions listed if none meet the quality bar
✓ Better to have empty sections than vague, useless descriptions

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
    
    # Store in state (no structure_tree - user doesn't want it)
    state.project_analysis = {
        "detailed_analysis": detailed_analysis,
        "file_count": len(detailed_analysis),  # Count only analyzed files
        "total_files": len(file_paths),  # Total files in repo
        "languages": list(set(info.get("type", "unknown") for info in repo_data.values() if info.get("type") not in ["css", "scss", "sass", "less"]))
    }
    
    print(f"[ANALYSIS] Analyzed {len(detailed_analysis)} files out of {len(file_paths)} total files")
    
    return state


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
    
    # NO fallback for functions - if LLM couldn't explain them meaningfully, don't list them
    # This ensures we only show functions with proper explanations
    
    # Fallback: if no purpose, use generic
    if not result["purpose"]:
        result["purpose"] = "This file is part of the application codebase."
        result["summary"] = result["purpose"]
    
    return result
