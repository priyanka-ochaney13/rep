import base64
import logging
import requests
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.graph.graph import run_pipeline
from app.models.state import DocGenState, DocGenPreferences
from app.utils.cognito_auth import verify_cognito_token, get_user_info_from_token
from app.utils.dynamodb import (
    save_user_preferences, get_user_preferences,
    save_documentation_record, get_user_documentation_history,
    get_documentation_by_id, delete_documentation_record,
    test_connection
)
from fastapi.responses import StreamingResponse
import io, os
import zipfile
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()
app = FastAPI(
    title="RepoX Backend API",
    description="Backend API for RepoX with AWS Cognito authentication",
    version="1.0.0"
)

# Configure CORS to allow requests from React frontend running locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security scheme for Bearer token authentication
security = HTTPBearer()

# AWS Cognito client for user management operations

cognito_client = boto3.client('cognito-idp', region_name=os.getenv('AWS_REGION', 'us-east-1'))
USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID', 'us-east-1_YOUR_USERPOOL_ID')
APP_CLIENT_ID = os.getenv('COGNITO_APP_CLIENT_ID', 'YOUR_APP_CLIENT_ID')


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials from Authorization header
        
    Returns:
        Dict containing user information from verified token
        
    Raises:
        HTTPException: If token is invalid or verification fails
    """
    # HTTPBearer already extracts the token from "Bearer TOKEN" format
    # So credentials.credentials contains just the token string
    token = credentials.credentials
    
    # Verify the token with Cognito
    claims = verify_cognito_token(token)
    
    # Extract user information
    user_info = get_user_info_from_token(claims)
    
    return user_info


@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI on Render!"}


@app.get("/protected")
def protected_route(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Protected route that requires valid AWS Cognito JWT access token.
    
    This endpoint:
    1. Extracts the Bearer token from the Authorization header
    2. Verifies the token with AWS Cognito
    3. Returns user claims if valid, or 401 if invalid
    
    Args:
        current_user: Authenticated user information from JWT token
        
    Returns:
        Dict containing user information and token claims
    """
    return {
        "message": "Access granted to protected resource",
        "user": current_user,
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    }


@app.get("/user/profile")
def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get current user profile information from JWT token.
    
    Args:
        current_user: Authenticated user information from JWT token
        
    Returns:
        Dict containing user profile information
    """
    return {
        "username": current_user.get("username"),
        "email": current_user.get("email"),
        "user_id": current_user.get("sub"),
        "groups": current_user.get("cognito:groups", []),
        "roles": current_user.get("cognito:roles", []),
        "auth_time": current_user.get("auth_time"),
        "token_expires": current_user.get("exp")
    }


@app.post("/auth/confirm-signup")
async def confirm_signup(
    username: str = Form(...),
    confirmation_code: str = Form(...)
):
    """
    Confirm user signup with verification code sent to email.
    
    Args:
        username: User's email address (used as username in Cognito)
        confirmation_code: 6-digit verification code sent to email
        
    Returns:
        Dict with confirmation status
        
    Raises:
        HTTPException: If confirmation fails
    """
    try:
        response = cognito_client.confirm_sign_up(
            ClientId=APP_CLIENT_ID,
            Username=username,
            ConfirmationCode=confirmation_code
        )
        
        return {
            "message": "Account confirmed successfully",
            "username": username,
            "status": "confirmed"
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        if error_code == 'CodeMismatchException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please check your email and try again."
            )
        elif error_code == 'ExpiredCodeException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code."
            )
        elif error_code == 'UserNotFoundException':
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please check your email address."
            )
        elif error_code == 'NotAuthorizedException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already confirmed or confirmation is not required."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Confirmation failed: {error_message}"
            )


@app.post("/auth/resend-confirmation")
async def resend_confirmation_code(
    username: str = Form(...)
):
    """
    Resend verification code to user's email address.
    
    Args:
        username: User's email address (used as username in Cognito)
        
    Returns:
        Dict with resend status
        
    Raises:
        HTTPException: If resend fails
    """
    try:
        response = cognito_client.resend_confirmation_code(
            ClientId=APP_CLIENT_ID,
            Username=username
        )
        
        return {
            "message": "Verification code sent successfully",
            "username": username,
            "delivery_medium": response.get('CodeDeliveryDetails', {}).get('DeliveryMedium', 'EMAIL')
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        if error_code == 'UserNotFoundException':
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please check your email address."
            )
        elif error_code == 'InvalidParameterException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email address format."
            )
        elif error_code == 'LimitExceededException':
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait before requesting another code."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to resend code: {error_message}"
            )


@app.post("/auth/signup")
async def signup_user(
    password: str = Form(...),
    email: str = Form(...)
):
    """
    Sign up a new user with email verification.
    
    Args:
        password: User's password
        email: User's email address (also used as username)
        
    Returns:
        Dict with signup status and next steps
        
    Raises:
        HTTPException: If signup fails
    """
    try:
        response = cognito_client.sign_up(
            ClientId=APP_CLIENT_ID,
            Username=email,  # FIXED: Added Username parameter
            Password=password,
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': email
                }
            ]
        )
        
        return {
            "message": "User created successfully. Please check your email for verification code.",
            "username": email,  # FIXED: Return username
            "user_confirmed": response.get('UserConfirmed', False),
            "next_step": "confirm_signup" if not response.get('UserConfirmed', False) else "signin"
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        if error_code == 'UsernameExistsException':
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists."
            )
        elif error_code == 'InvalidPasswordException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password does not meet requirements. Must be at least 8 characters with uppercase, lowercase, and numbers."
            )
        elif error_code == 'InvalidParameterException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email address or password format."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Signup failed: {error_message}"
            )


@app.post("/auth/signin")
async def signin_user(
    username: str = Form(...),
    password: str = Form(...)
):
    """
    Sign in a user with email and password.
    
    Args:
        username: User's email address (used as username in Cognito)
        password: User's password
        
    Returns:
        Dict with signin status and tokens if successful
        
    Raises:
        HTTPException: If signin fails
    """
    try:
        print(f"Attempting signin for: {username}")  # Debug log
        print(f"Using Client ID: {APP_CLIENT_ID}")  # Debug log
        
        # Use initiate_auth instead of admin_initiate_auth
        response = cognito_client.initiate_auth(
            ClientId=APP_CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password
            }
        )
        
        print(f"Signin response: {response}")  # Debug log
        
        # Check if user needs to be confirmed
        if response.get('ChallengeName') == 'NEW_PASSWORD_REQUIRED':
            return {
                "message": "New password required",
                "challenge": "NEW_PASSWORD_REQUIRED",
                "session": response.get('Session')
            }
        
        # Extract tokens from successful authentication
        auth_result = response.get('AuthenticationResult', {})
        
        return {
            "message": "Sign in successful",
            "access_token": auth_result.get('AccessToken'),
            "id_token": auth_result.get('IdToken'),
            "refresh_token": auth_result.get('RefreshToken'),
            "token_type": auth_result.get('TokenType', 'Bearer'),
            "expires_in": auth_result.get('ExpiresIn')
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        print(f"Signin error: {error_code} - {error_message}")  # Debug log
        
        if error_code == 'InvalidParameterException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Authentication flow not enabled. Error: {error_message}. Please enable USER_PASSWORD_AUTH in your Cognito App Client settings."
            )
        elif error_code == 'NotAuthorizedException':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Incorrect username or password. Details: {error_message}"
            )
        elif error_code == 'UserNotFoundException':
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email address."
            )
        elif error_code == 'UserNotConfirmedException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please verify your email address before signing in. Check your email for the verification code."
            )
        elif error_code == 'PasswordResetRequiredException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset is required. Please reset your password."
            )
        elif error_code == 'TooManyRequestsException':
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Sign in failed: {error_code} - {error_message}"
            )


# ==================== DYNAMODB ENDPOINTS ====================

@app.get("/db/test")
async def test_dynamodb_connection(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Test DynamoDB connection (requires authentication).
    
    Returns:
        Dict with connection status
    """
    result = test_connection()
    return result


@app.post("/user/preferences")
async def save_preferences(
    preferences: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Save user preferences to DynamoDB.
    
    Args:
        preferences: User preferences dict
        current_user: Authenticated user from JWT
        
    Returns:
        Dict with save status
    """
    user_id = current_user.get('sub')
    result = save_user_preferences(user_id, preferences)
    return result


@app.get("/user/preferences")
async def get_preferences(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get user preferences from DynamoDB.
    
    Args:
        current_user: Authenticated user from JWT
        
    Returns:
        Dict containing user preferences
    """
    user_id = current_user.get('sub')
    preferences = get_user_preferences(user_id)
    
    if preferences is None:
        # Return default preferences if none exist
        return {
            "theme": "light",
            "notifications": True,
            "auto_commit": False
        }
    
    return preferences


@app.get("/user/history")
async def get_history(
    limit: int = 10,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get user's documentation generation history.
    
    Args:
        limit: Maximum number of records to return
        current_user: Authenticated user from JWT
        
    Returns:
        List of documentation records
    """
    user_id = current_user.get('sub')
    history = get_user_documentation_history(user_id, limit)
    return {"history": history}


@app.get("/user/documentation/{record_id}")
async def get_documentation(
    record_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get a specific documentation record by ID.
    
    Args:
        record_id: Documentation record ID
        current_user: Authenticated user from JWT
        
    Returns:
        Documentation record
    """
    user_id = current_user.get('sub')
    record = get_documentation_by_id(user_id, record_id)
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documentation record not found"
        )
    
    return record


@app.delete("/user/documentation/{record_id}")
async def delete_documentation(
    record_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete a documentation record.
    
    Args:
        record_id: Documentation record ID to delete
        current_user: Authenticated user from JWT
        
    Returns:
        Dict with deletion status
    """
    user_id = current_user.get('sub')
    result = delete_documentation_record(user_id, record_id)
    return result


# ==================== MODIFIED GENERATE ENDPOINT ====================

@app.post("/generate")
async def generate_docs(
    input_type: str = Form(...),
    input_data: str = Form(None),
    zip_file: UploadFile = File(None),
    branch: str = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    print("/generate")
    
    # Validate branch name if provided
    if branch:
        branch = branch.strip()
        if not branch:
            branch = None  # Use default
    
    try:
        if input_type == "zip" and zip_file:
            content = await zip_file.read()
            base64_zip = base64.b64encode(content).decode("utf-8")
            state = DocGenState(input_type="zip", input_data=base64_zip, branch=branch, preferences=DocGenPreferences(
                generate_readme=True,
                generate_summary=True,
                visualize_structure=True
            ))
        else:
            state = DocGenState(input_type=input_type, input_data=input_data, branch=branch, preferences=DocGenPreferences(
                generate_readme=True,
                generate_summary=True,
                visualize_structure=True
            ))

        result = run_pipeline(state)
    except ValueError as ve:
        # Handle branch not found and other validation errors
        error_message = str(ve)
        logger.error(f"Validation error: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    except requests.HTTPError as he:
        # Handle GitHub API errors
        error_message = str(he)
        logger.error(f"GitHub API error: {error_message}")
        
        if "rate limit" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="GitHub API rate limit exceeded. Please add a GITHUB_TOKEN environment variable or try again later."
            )
        elif "404" in error_message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository or branch not found. Please check the URL and branch name."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"GitHub API error: {error_message}"
            )
    except Exception as e:
        # Handle any other unexpected errors
        error_message = str(e)
        logger.error(f"Unexpected error during documentation generation: {error_message}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate documentation: {error_message}"
        )
    
    # Debug logging
    logger.info("=" * 60)
    logger.info("📤 API Response Preview:")
    logger.info(f"README length: {len(result.get('readme', '')) if result.get('readme') else 0} characters")
    logger.info(f"Summaries count: {len(result.get('summaries', {})) if result.get('summaries') else 0} files")
    logger.info(f"Summaries keys: {list(result.get('summaries', {}).keys()) if result.get('summaries') else []}")
    logger.info("=" * 60)

    # Save documentation to DynamoDB
    try:
        user_id = current_user.get('sub')
        repo_identifier = input_data if input_type == "url" else "zip_upload"
        
        metadata = {
            "visuals": result.get("visuals"),
            "folder_tree": result.get("folder_tree"),
            "input_type": result.get("input_type"),
            "project_analysis": result.get("project_analysis")
        }
        
        save_result = save_documentation_record(
            user_id=user_id,
            repo_url=repo_identifier,
            readme_content=result.get("readme", ""),
            summaries=result.get("summaries", {}),
            metadata=metadata
        )
        
        logger.info(f"DynamoDB save result: {save_result}")
        
    except Exception as e:
        logger.warning(f"Failed to save to DynamoDB (non-critical): {str(e)}")

    return {
        "readme": result.get("readme"),
        "summaries": result.get("summaries"),
        "modified_files": result.get("modified_files"),
        "visuals": result.get("visuals"),
        "folder_tree": result.get("folder_tree"),
        "input_type": result.get("input_type"),
        "project_analysis": result.get("project_analysis"),
    }

@app.post("/download-zip")
async def download_modified_zip(modified_files_json: str = Form(...)):
    modified_files = json.loads(modified_files_json)
    zip_stream = io.BytesIO()

    with zipfile.ZipFile(zip_stream, "w", zipfile.ZIP_DEFLATED) as zf:
        for filepath, code in modified_files.items():
            zf.writestr(filepath, code)

    zip_stream.seek(0)
    return StreamingResponse(
        zip_stream,
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": "attachment; filename=modified_code.zip"}
    )

from fastapi.responses import JSONResponse
import uuid

zip_store = {}

@app.post("/generate-and-download")
async def generate_and_download(
    input_type: str = Form(...),
    input_data: str = Form(None),
    zip_file: UploadFile = File(None),
    branch: str = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if input_type == "zip" and zip_file:
        content = await zip_file.read()
        base64_zip = base64.b64encode(content).decode("utf-8")
        state = DocGenState(input_type="zip", input_data=base64_zip, branch=branch, preferences=DocGenPreferences(
            generate_readme=True,
            generate_summary=True,
            visualize_structure=True
        ))
    else:
        state = DocGenState(input_type=input_type, input_data=input_data, branch=branch, preferences=DocGenPreferences(
            generate_readme=True,
            generate_summary=True,
            visualize_structure=True
        ))

    result = run_pipeline(state)
    modified_files = result.get("modified_files", {})
    readme = result.get("readme")

    zip_stream = io.BytesIO()
    with zipfile.ZipFile(zip_stream, "w", zipfile.ZIP_DEFLATED) as zf:
        for filepath, code in modified_files.items():
            zf.writestr(filepath, code)
        if readme:
            zf.writestr("README.md", readme)
    zip_stream.seek(0)

    download_id = str(uuid.uuid4())
    zip_store[download_id] = zip_stream.getvalue()

    return {
        "download_url": f"/download-zip/{download_id}",
        "readme": result.get("readme"),
        "summaries": result.get("summaries"),
        "modified_files": result.get("modified_files"),
        "visuals": result.get("visuals"),
        "folder_tree": result.get("folder_tree"),
        "input_type": result.get("input_type")
    }

@app.get("/download-zip/{download_id}")
def download_zip(download_id: str):
    zip_bytes = zip_store.get(download_id)
    if not zip_bytes:
        return JSONResponse({"error": "Invalid or expired download ID"}, status_code=404)

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": "attachment; filename=docgen_output.zip"}
    )