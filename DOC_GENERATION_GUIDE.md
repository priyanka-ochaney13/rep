# 📚 Documentation Generation - Development Guide

## 🎯 Current Status

Your doc generation system is **already set up** with a modular pipeline architecture! Here's what you have:

### ✅ What's Working

1. **Pipeline Architecture** (`app/graph/graph.py`)
   - Sequential processing pipeline
   - 6 nodes: fetch → parse → summarize → generate README → visualize → output
   - Returns structured JSON response

2. **State Management** (`app/models/state.py`)
   - Pydantic models for type safety
   - Tracks entire generation process
   - Preferences system for feature toggling

3. **AI Integration** (`app/utils/mistral.py`)
   - Groq (qwen-qwq-32b) for README generation
   - Mistral AI (codestral-2405) for code summaries
   - Graceful fallback if APIs not available

4. **Input Support**
   - GitHub repositories (with branch support)
   - ZIP file uploads
   - Custom uploads

5. **Processing Nodes**
   - `fetch_code.py` - Clone repos or extract zips
   - `parse_code.py` - Parse code structure
   - `summarize_code.py` - Generate summaries
   - `generate_readme.py` - Create README
   - `visualize_code.py` - Generate diagrams
   - `output_node.py` - Format final output

---

## 🚀 Quick Start - Testing the Pipeline

### Step 1: Set Up Environment Variables

Create/update `backend/.env`:

```bash
# AI Model API Keys (GET THESE FIRST!)
GROQ_API_KEY=your_groq_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here

# AWS Cognito (already set up)
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_iwrnWG5g3
COGNITO_APP_CLIENT_ID=17evshm31c2bi6id73efqjggn4
```

**Get API Keys:**
- Groq: https://console.groq.com/ (FREE!)
- Mistral AI: https://console.mistral.ai/

### Step 2: Install Required Dependencies

```bash
cd backend
pip install langchain langchain-groq langchain-mistralai gitpython
```

### Step 3: Test the Pipeline

**Via Frontend (Easiest):**
1. Start backend: `python -m uvicorn main:app --reload`
2. Start frontend: `cd ../frontend && npm run dev`
3. Go to http://localhost:5173/repositories
4. Click "Connect Repository"
5. Enter: `https://github.com/yourusername/small-repo`
6. Watch the generation happen!

---

## 🔧 Development Roadmap (What to Build)

### 🎯 Priority 1: Start Here! (2-3 days)

#### Task 1.1: Add Error Handling ⚠️
**Why:** Pipeline fails silently right now

**Files to edit:**
- `app/graph/nodes/fetch_code.py`
- `app/graph/nodes/parse_code.py`
- `app/graph/nodes/summarize_code.py`

**What to do:**
```python
# Add to each node:
try:
    # existing code
except Exception as e:
    logger.error(f"Error in [node_name]: {str(e)}")
    state.error = str(e)
    return state
```

#### Task 1.2: Add Logging 📝
**Why:** Can't debug without logs

**What to do:**
```python
import logging
logger = logging.getLogger(__name__)

def fetch_code(state: DocGenState) -> DocGenState:
    logger.info(f"Fetching: {state.input_type} - {state.input_data[:50]}")
    # ... rest of code
    logger.info("Fetch complete!")
```

#### Task 1.3: Fix Input Type 🔧
**Why:** Frontend sends "url" but backend expects "github"

**File:** `app/graph/nodes/fetch_code.py`
```python
# Change line 11:
if state.input_type in ("github", "repo", "url"):  # Add "url" here!
```

---

### 🎯 Priority 2: Better Output (3-4 days)

#### Task 2.1: Improve README Generation
**File:** `app/graph/nodes/generate_readme.py`

**Add these sections:**
- Installation instructions
- Usage examples
- API documentation (if applicable)
- Contributing guidelines
- License

#### Task 2.2: Better Code Summaries
**File:** `app/graph/nodes/summarize_code.py`

**Improve to:**
- Summarize by file type
- Identify main entry points
- Explain complex functions
- List dependencies

#### Task 2.3: Generate Mermaid Diagrams
**File:** `app/graph/nodes/visualize_code.py`

**Create:**
- Architecture diagram
- Dependency graph
- Folder structure tree

---

### 🎯 Priority 3: Advanced Features (1-2 weeks)

#### Task 3.1: Progress Tracking
**Why:** User doesn't know what's happening

**Files to edit:**
- `app/models/state.py` - Add progress field
- `app/graph/graph.py` - Update progress after each node
- `backend/main.py` - Add `/generate-status/:id` endpoint
- Frontend - Poll for progress updates

#### Task 3.2: Caching
**Why:** Don't regenerate docs for same repo

**Implementation:**
- Cache key: `{repo_url}:{branch}:{commit_hash}`
- Store in Redis or file system
- Return cached result if available

#### Task 3.3: Background Jobs
**Why:** Large repos take minutes

**Use:** Celery or RQ (Python job queues)
- Submit job → return job ID
- Frontend polls for status
- Notify when complete

---

## 📊 Architecture Overview

```
User clicks "Connect Repository"
         ↓
Frontend sends POST /generate
         ↓
Backend (main.py) calls run_pipeline()
         ↓
    ┌─────────────────────────────────┐
    │  1. fetch_code                  │
    │     ↓                            │
    │  2. parse_code                  │
    │     ↓                            │
    │  3. summarize_code (AI)         │
    │     ↓                            │
    │  4. generate_readme (AI)        │
    │     ↓                            │
    │  5. visualize_code              │
    │     ↓                            │
    │  6. output_node                 │
    └─────────────────────────────────┘
         ↓
Returns JSON with:
- readme (markdown string)
- summaries (dict of file → summary)
- visuals (mermaid diagrams)
- folder_tree (structure)
         ↓
Frontend displays in UI
```

---

## 🎨 Current API Response

```json
{
  "readme": "# Project Name\n\n## Description\n...",
  "summaries": {
    "src/main.py": "Main entry point...",
    "src/utils.py": "Utility functions..."
  },
  "visuals": {
    "architecture": "graph TD;\n  A-->B;"
  },
  "folder_tree": "repo/\n  src/\n    main.py\n    utils.py",
  "modified_files": {},
  "input_type": "url"
}
```

---

## 💡 Quick Wins (Do These Today!)

### 1. Test Current Pipeline
```bash
# In backend directory:
python -m uvicorn main:app --reload

# In another terminal:
curl -X POST http://localhost:8000/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "input_type=url" \
  -F "input_data=https://github.com/facebook/react" \
  -F "branch=main"
```

### 2. Add Basic Logging
Edit `app/graph/graph.py`:
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_pipeline(state: DocGenState) -> Dict[str, Any]:
    logger.info("Starting pipeline...")
    state = fetch_code(state)
    logger.info("Fetched code")
    state = parse_code(state)
    logger.info("Parsed code")
    # ... rest
```

### 3. Fix "url" Input Type
Edit `app/graph/nodes/fetch_code.py` line 11:
```python
if state.input_type in ("github", "repo", "url"):  # Added "url"
```

---

## 🐛 Common Issues

### Issue: "No module named 'langchain'"
```bash
pip install langchain langchain-groq langchain-mistralai
```

### Issue: "Git clone failed"
```bash
pip install gitpython
```

### Issue: "API key not found"
Add to `.env`:
```
GROQ_API_KEY=gsk_your_key_here
MISTRAL_API_KEY=your_key_here
```

### Issue: Generation returns empty results
- Check logs in backend terminal
- Verify API keys are set
- Test with small repo first

---

## 📝 Step-by-Step Implementation Plan

### Day 1: Get It Working
1. [ ] Get API keys (Groq + Mistral)
2. [ ] Add keys to `.env`
3. [ ] Test with a small repo
4. [ ] Check what's generated
5. [ ] Document issues

### Day 2-3: Error Handling
1. [ ] Add logging to all nodes
2. [ ] Add try-catch blocks
3. [ ] Return error messages
4. [ ] Test error scenarios

### Day 4-5: Better Output
1. [ ] Improve README generation
2. [ ] Better code summaries
3. [ ] Add more sections

### Day 6-7: Visualizations
1. [ ] Generate Mermaid diagrams
2. [ ] Create folder trees
3. [ ] Add dependency graphs

### Week 2: Polish
1. [ ] Progress tracking
2. [ ] Caching
3. [ ] Performance optimization
4. [ ] UI improvements

---

## 🚀 Start NOW: First Code Change

**File:** `app/graph/nodes/fetch_code.py`

Replace the entire file with:

```python
import random
import logging
from app.models.state import DocGenState
from app.utils.file_ops import clone_github_repo, extract_zip_file

logger = logging.getLogger(__name__)

def fetch_code(state: DocGenState) -> DocGenState:
    """Fetch code from GitHub, ZIP, or upload."""
    try:
        no = random.randint(1, 10000000)
        path = f"{no}"
        
        logger.info(f"[FETCH] Input type: {state.input_type}")
        logger.info(f"[FETCH] Input data: {str(state.input_data)[:100]}...")
        
        # Support multiple input types
        if state.input_type in ("github", "repo", "url"):
            logger.info(f"[FETCH] Cloning GitHub repo: {state.input_data}")
            if state.branch:
                repo_path = clone_github_repo(state.input_data, path, branch=state.branch)
            else:
                repo_path = clone_github_repo(state.input_data, path)
            state.working_dir = {"repo_path": repo_path}
            logger.info(f"[FETCH] ✓ Cloned to: {repo_path}")
            
        elif state.input_type == "zip":
            logger.info("[FETCH] Extracting ZIP file")
            extracted_path = extract_zip_file(state.input_data, path)
            state.working_dir = {"repo_path": extracted_path}
            logger.info(f"[FETCH] ✓ Extracted to: {extracted_path}")
            
        elif state.input_type == "upload":
            state.working_dir = state.input_data
            logger.info("[FETCH] ✓ Using uploaded data")
            
        else:
            error_msg = f"Unsupported input_type: {state.input_type}. Use: github, repo, url, zip, or upload"
            logger.error(f"[FETCH] ✗ {error_msg}")
            raise ValueError(error_msg)
            
    except Exception as e:
        logger.error(f"[FETCH] ✗ Error: {str(e)}", exc_info=True)
        # Don't crash - return error in state
        state.error = f"Failed to fetch code: {str(e)}"
        
    return state
```

**This adds:**
- ✅ Logging
- ✅ Error handling
- ✅ Support for "url" input type
- ✅ Better error messages

**Test it:**
1. Save the file
2. Backend should auto-reload
3. Try generating docs for a repo
4. Watch the logs in terminal!

---

## ✅ Success Checklist

- [ ] API keys configured
- [ ] Dependencies installed
- [ ] Can test with small repo
- [ ] Logging shows in terminal
- [ ] Errors are readable
- [ ] README is generated
- [ ] Summaries are created

---

## 🎯 Your Next Steps

1. **TODAY:** Get API keys, test with small repo
2. **THIS WEEK:** Add error handling to all nodes
3. **NEXT WEEK:** Improve README and summaries
4. **MONTH 1:** Add progress tracking, caching, better UI

---

**Ready to code? Start with the fetch_code.py change above!** 🚀

Questions? Check the existing code in `app/graph/nodes/` or ask!
