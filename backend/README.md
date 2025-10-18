# Python Backend for Repox

## Setup

1. Create a virtual environment (optional but recommended):
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Run the backend server:
   ```powershell
   uvicorn main:app --reload
   ```

The API will be available at http://127.0.0.1:8000

## Example Endpoint
- `GET /` returns a welcome message.

You can now extend this backend with more endpoints as needed.
