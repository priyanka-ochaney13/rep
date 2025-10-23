"""
In-memory version of parse_code that works directly with file content dictionary.
No temporary file storage needed!
"""
import os
from app.models.state import DocGenState
from tree_sitter import Language, Parser

import tree_sitter_python as tspython
import tree_sitter_java as tsjava
import tree_sitter_javascript as tsjs
import tree_sitter_html as tshtml
import tree_sitter_typescript as tsts
import tree_sitter_css as tscss
import tree_sitter_c as tsc
import tree_sitter_cpp as tscpp
import tree_sitter_go as tsgo
import tree_sitter_kotlin as tskotlin

LANGUAGE_MAP = {
    "python": tspython.language(),
    "java": tsjava.language(),
    "javascript": tsjs.language(),
    "typescript": tsts.language_typescript(),
    "tsx": tsts.language_tsx(),
    "html": tshtml.language(),
    "css": tscss.language(),
    "c": tsc.language(),
    "cpp": tscpp.language(),
    "go": tsgo.language(),
    "kotlin": tskotlin.language(),
}

LANGUAGE_EXTENSIONS = {
    "python": [".py"],
    "java": [".java"],
    "javascript": [".js"],
    "typescript": [".ts"],
    "tsx": [".tsx"],
    "html": [".html"],
    "css": [".css"],
    "c": [".c", ".h"],
    "cpp": [".cpp", ".cc", ".cxx", ".hpp", ".h"],
    "go": [".go"],
    "kotlin": [".kt"],
}

EXCLUDED_FILES = {
    "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb",
    "vite.config.ts", "vite.config.js", "webpack.config.js", "rollup.config.js",
    "esbuild.config.js", "snowpack.config.js", "metro.config.js", "vite-env.d.ts",
    "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", "tsconfig.base.json",
    "tslint.json", "eslint.config.js", ".eslintrc.js", ".eslintrc.json", ".prettierrc", ".prettierrc.js",
    ".prettierrc.json", ".stylelintrc", ".stylelintrc.json", "stylelint.config.js",
    "tailwind.config.js", "postcss.config.js", "babel.config.js", ".babelrc", ".babelrc.js",
    "index.html", "favicon.ico", "robots.txt", "sitemap.xml",
    ".editorconfig", ".gitignore", ".gitattributes", ".npmrc", ".nvmrc", ".dockerignore",
    ".env", ".env.local", ".env.development", ".env.production", ".env.test",
    "jest.config.js", "jest.config.ts", "karma.conf.js", "mocha.opts", "vitest.config.ts",
    "cypress.config.js", "cypress.json", ".coveragerc", "tox.ini", "pytest.ini", "setup.cfg",
    "vercel.json", "netlify.toml", "now.json", "firebase.json", "azure-pipelines.yml",
    "Procfile", "Makefile", "Dockerfile", "docker-compose.yml", ".travis.yml",
    ".circleci/config.yml", ".github/workflows/main.yml", ".gitlab-ci.yml",
    "README.md", "README", "CONTRIBUTING.md", "CHANGELOG.md", "CODEOWNERS",
    "LICENSE", "LICENSE.md", "SECURITY.md", "SUPPORT.md", "NOTICE", "AUTHORS",
    "requirements.txt", "Pipfile", "Pipfile.lock", "pyproject.toml", "setup.py", "MANIFEST.in",
    "environment.yml", "conda.yml", ".python-version", ".pylintrc",
    "mypy.ini", "pyrightconfig.json", ".flake8", ".isort.cfg",
    "mlruns", "dvc.yaml", "dvc.lock", ".dvc", "wandb", ".mlflow", ".mlem", "output.log",
    "checkpoints", "runs", "events.out.tfevents.*", "tensorboard.log", "lightning_logs",
    ".ipynb_checkpoints", "*.ipynb",
    "yarn-error.log", "npm-debug.log", "snapshot.txt", "poetry.lock", "poetry.toml",
    "terraform.tf", "terraform.tfvars", "*.tfstate", "*.tfstate.backup",
    "cloudbuild.yaml", ".helmignore", "Chart.yaml", "values.yaml",
    "kustomization.yaml", "skaffold.yaml",
    ".DS_Store", "Thumbs.db", "desktop.ini",
}

EXCLUDED_FOLDERS = {
    "node_modules", "venv", ".venv", "env", ".env",
    ".git", ".idea", ".vscode", "__pycache__",
    "dist", "build", ".next", "out", ".parcel-cache",
    "coverage", "logs", "tmp", "temp",
}


def detect_language(file_name: str):
    """Detect programming language from file extension"""
    for lang, extensions in LANGUAGE_EXTENSIONS.items():
        if any(file_name.endswith(ext) for ext in extensions):
            return lang
    return None


def should_exclude_file(file_path: str) -> bool:
    """Check if file should be excluded based on name or path"""
    filename = os.path.basename(file_path)
    
    # Check excluded filenames
    if filename in EXCLUDED_FILES:
        return True
    
    # Check if in excluded folder
    path_parts = file_path.split('/')
    if any(part in EXCLUDED_FOLDERS for part in path_parts):
        return True
    
    return False


def extract_names_and_clean(source_code: str, lang_key: str):
    """Extract function/class names and remove comments"""
    language_obj = LANGUAGE_MAP.get(lang_key)
    if not language_obj:
        return [], source_code

    parser = Parser(Language(language_obj))
    tree = parser.parse(bytes(source_code, "utf-8"))
    root_node = tree.root_node

    comment_ranges = []

    def collect_comments(node):
        if "comment" in node.type:
            comment_ranges.append((node.start_byte, node.end_byte))
        for child in node.children:
            collect_comments(child)

    collect_comments(root_node)

    code_bytes = bytearray(source_code, "utf-8")
    for start, end in sorted(comment_ranges, reverse=True):
        del code_bytes[start:end]

    cleaned_code = code_bytes.decode("utf-8")
    tree = parser.parse(bytes(cleaned_code, "utf-8"))
    root_node = tree.root_node

    cursor = root_node.walk()
    visited = set()
    found_names = []

    while True:
        node = cursor.node
        if node.id in visited:
            if cursor.goto_next_sibling():
                continue
            if not cursor.goto_parent():
                break
            continue

        visited.add(node.id)

        if node.type in [
            "function_definition", "function_declaration", "method_definition", "method_declaration",
            "class_definition", "class_declaration", "class_specifier", "struct_specifier", "type_declaration"
        ]:
            name_node = node.child_by_field_name("name")
            if name_node:
                name = cleaned_code[name_node.start_byte:name_node.end_byte]
                found_names.append(name.strip())

        if cursor.goto_first_child():
            continue
        if cursor.goto_next_sibling():
            continue
        while not cursor.goto_next_sibling():
            if not cursor.goto_parent():
                break

    return found_names, cleaned_code


def parse_code_from_memory(files_content: dict) -> dict:
    """
    Parse code directly from in-memory file content dictionary.
    
    Args:
        files_content: Dictionary mapping file paths to their string contents
        
    Returns:
        Dictionary mapping file paths to parsed data
    """
    structure = {}
    
    for file_path, source_code in files_content.items():
        # Skip excluded files
        if should_exclude_file(file_path):
            continue
        
        # Detect language
        lang = detect_language(file_path)
        if not lang:
            continue
        
        try:
            # Extract function names and clean code
            contains, cleaned_code = extract_names_and_clean(source_code, lang)
            
            structure[file_path] = {
                "file": file_path,
                "code": cleaned_code,
                "type": lang,
                "contains": contains
            }
            
        except Exception as e:
            print(f"Error parsing file {file_path}: {e}")
            continue
    
    return structure


def parse_code_memory(state: DocGenState):
    """
    Parse code from in-memory files (no temp storage needed).
    
    Expects state.files_content to be a dictionary of {file_path: content}
    """
    all_parsed = {}
    
    print(f"[PARSE] Parsing code from in-memory files")
    
    # Check if we have in-memory content (REQUIRED in zero-storage mode)
    if not hasattr(state, 'files_content') or not state.files_content:
        raise RuntimeError(
            "❌ ZERO STORAGE MODE ERROR: No in-memory files available!\n"
            "files_content is required. Make sure fetch_code ran successfully."
        )
    
    print(f"[PARSE] Processing {len(state.files_content)} in-memory files")
    parsed = parse_code_from_memory(state.files_content)
    if parsed:
        all_parsed["repo_path"] = parsed
    print(f"[PARSE] ✓ Parsed {len(parsed)} code files")
    
    state.parsed_data = all_parsed
    return state
