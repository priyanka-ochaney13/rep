
# RepoX (rep)

A developer tool that generates project documentation, README files, and visualizations from a repository (URL or ZIP).

> Backend: FastAPI (Python)  •  Frontend: React + Vite  •  Auth: AWS Cognito  •  Storage: DynamoDB

## Table of contents

- Features
- Architecture
- Quickstart
	- Prerequisites
	- Backend (API)
	- Frontend (UI)
- Configuration & Environment variables
- Usage
- Testing
- Development notes & contract
- Contributing
- License
- Contact

## Features

- Generate README and per-file summaries for a repository (by URL or uploaded ZIP).
- Visualize project structure and code relationships.
- Authenticate users via AWS Cognito (signup, confirm, signin).
- Save and retrieve user preferences and documentation history in DynamoDB.
- Regenerate documentation on-demand and download modified code as a ZIP.
- Frontend with React + Vite, Amplify/AWS helpers, and markdown rendering.

## Architecture

- Backend: FastAPI (Python). Core logic under `backend/app/`:
	- `app.graph` - pipeline orchestration for documentation generation
	- `app.utils` - integrations (Cognito, DynamoDB, GitHub, LLMs, tree-sitter parsing)
	- `main.py` - REST API endpoints (auth, generate, regenerate, downloads, user endpoints)
- Frontend: React + Vite in `frontend/` with UI components under `frontend/src/components`.
- Persistence: AWS DynamoDB for user preferences and documentation records.
- Auth: AWS Cognito for user signup/signin flows.
- Integrations: GitHub API (optionally with token), OpenAI / Mistral LLMs, tree-sitter language parsers.

## Quickstart

### Prerequisites

- Python 3.10+ (or the version your environment supports)
- Node.js 18+ and npm (or yarn)
- AWS credentials configured (for DynamoDB/Cognito) if you use AWS features
- (Optional) GitHub token to avoid rate limits: `GITHUB_TOKEN`

Commands below are PowerShell-friendly for Windows.

### Backend (API)

1. Open a terminal and change to the backend directory:
2. Create and activate a virtual environment (PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Create a `.env` file in `backend/` with the required environment variables (see below).

5. Run the development server (from `backend/`):

```powershell
python -m uvicorn main:app --reload
```

The API should be available at http://127.0.0.1:8000 by default.

Notes:
- The backend uses `boto3` and expects AWS credentials in environment variables or the standard AWS config locations when using DynamoDB/Cognito.
- The `main.py` exposes endpoints such as `/generate`, `/protected`, `/user/*`, `/download-zip` and others.

### Frontend (UI)

1. Change to the frontend folder:

```powershell
cd C:\Users\priya\OneDrive\Desktop\rep\frontend
```

2. Install dependencies:

```powershell
npm install
```

3. Run the dev server:

```powershell
npm run dev
```

Vite typically serves the frontend on http://localhost:5173. The backend CORS settings allow requests from this origin by default.

## Configuration & Environment variables

Create a `backend/.env` (do not commit) and add keys similar to:

- AWS_REGION=us-east-1
- AWS_ACCESS_KEY_ID=...
- AWS_SECRET_ACCESS_KEY=...
- COGNITO_USER_POOL_ID=us-east-1_xxx
- COGNITO_APP_CLIENT_ID=your_app_client_id
- GITHUB_TOKEN=ghp_...
- OPENAI_API_KEY=sk-...
- MISTRAL_API_KEY=...

Keep secrets out of source control. Use a secrets manager or CI/CD secret storage for production deployments.

## Usage

- Use the `/generate` endpoint to create documentation from a repo URL or uploaded ZIP. Parameters:
	- `input_type`: "url" or "zip"
	- `input_data`: repo URL when `input_type` is "url"
	- `zip_file`: uploaded file when `input_type` is "zip"
	- `branch`: optional branch name
- Use frontend UI to signup/signin and submit URLs or ZIPs. Download artifacts via `/download-zip` or `/generate-and-download`.

## Testing

Backend contains pytest-style tests (e.g., `test_github_api.py`, `test_dynamodb.py`). From `backend/` with venv active:

```powershell
pip install pytest
pytest -q
```

If tests require AWS, configure test AWS credentials or use mocks for DynamoDB/Cognito calls.

## Development notes & contract

Contract (short):
- Inputs: repo URL or ZIP, optional branch, user JWT for protected endpoints.
- Outputs: generated README markdown, per-file summaries, visuals, and a ZIP of modified files.
- Error modes: invalid repo/branch (404), GitHub rate limits (429), missing/invalid auth (401), AWS/DynamoDB failures.

Edge cases to consider:
- Private GitHub repos need an appropriate `GITHUB_TOKEN` with repo access.
- Large repositories may exceed timeouts — consider background jobs or async workers for long runs.
- Branch names that don't exist will raise validation errors.

## Demo

- Demo video: https://youtu.be/5BBCFzBITnc

