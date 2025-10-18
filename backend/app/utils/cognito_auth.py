"""
AWS Cognito JWT Authentication Utilities

This module provides JWT token verification for AWS Cognito access tokens
with JWKS caching to improve performance and reduce API calls.
"""

import json
import time
from typing import Dict, Optional, Any
from datetime import datetime, timezone
import requests
from jose import jwt, JWTError
from fastapi import HTTPException, status


# AWS Cognito Configuration
import os

REGION = os.getenv('AWS_REGION', 'us-east-1')
USERPOOL_ID = os.getenv('COGNITO_USER_POOL_ID', 'us-east-1_YOUR_USERPOOL_ID')
APP_CLIENT_ID = os.getenv('COGNITO_APP_CLIENT_ID', 'YOUR_APP_CLIENT_ID')

# JWKS URL for the Cognito User Pool
JWKS_URL = f"https://cognito-idp.{REGION}.amazonaws.com/{USERPOOL_ID}/.well-known/jwks.json"

# Cache for JWKS keys (valid for 1 hour)
_jwks_cache = {
    'keys': None,
    'expires_at': 0
}

# Cache duration in seconds (1 hour)
CACHE_DURATION = 3600


def get_jwks() -> Dict[str, Any]:
    """
    Fetch JWKS (JSON Web Key Set) from AWS Cognito with caching.
    
    Returns:
        Dict containing the JWKS keys
        
    Raises:
        HTTPException: If unable to fetch JWKS from Cognito
    """
    global _jwks_cache
    
    # Check if cache is still valid
    current_time = time.time()
    if _jwks_cache['keys'] and current_time < _jwks_cache['expires_at']:
        return _jwks_cache['keys']
    
    try:
        # Fetch JWKS from Cognito
        response = requests.get(JWKS_URL, timeout=10)
        response.raise_for_status()
        
        jwks = response.json()
        
        # Update cache
        _jwks_cache['keys'] = jwks
        _jwks_cache['expires_at'] = current_time + CACHE_DURATION
        
        return jwks
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to fetch JWKS from Cognito: {str(e)}"
        )


def get_signing_key(token: str) -> Dict[str, Any]:
    """
    Get the signing key for the JWT token from JWKS.
    
    Args:
        token: JWT token to get signing key for
        
    Returns:
        Dict containing the signing key
        
    Raises:
        HTTPException: If unable to find appropriate signing key
    """
    # Decode token header to get the key ID (kid)
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing key ID (kid) in header"
            )
            
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token header: {str(e)}"
        )
    
    # Get JWKS and find the matching key
    jwks = get_jwks()
    
    for key in jwks.get('keys', []):
        if key.get('kid') == kid:
            return key
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Unable to find signing key with kid: {kid}"
    )


def verify_cognito_token(token: str) -> Dict[str, Any]:
    """
    Verify AWS Cognito JWT access token and return claims.
    
    Args:
        token: JWT access token from Cognito
        
    Returns:
        Dict containing the verified token claims
        
    Raises:
        HTTPException: If token is invalid, expired, or verification fails
    """
    try:
        # Get the signing key for this token
        signing_key = get_signing_key(token)
        
        # Verify and decode the token
        # Note: We don't verify the audience here as Cognito access tokens
        # don't always include the client_id in the aud claim
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=['RS256'],
            options={
                'verify_signature': True,
                'verify_exp': True,
                'verify_iat': True,
                'verify_aud': False,  # Cognito access tokens may not have aud claim
                'verify_iss': True,
                'require_exp': True,
                'require_iat': True
            }
        )
        
        # Verify the issuer matches our Cognito User Pool
        expected_issuer = f"https://cognito-idp.{REGION}.amazonaws.com/{USERPOOL_ID}"
        if claims.get('iss') != expected_issuer:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer"
            )
        
        # Verify the token type is an access token
        if claims.get('token_use') != 'access':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is not an access token"
            )
        
        # Verify the client ID matches our app client
        if claims.get('client_id') != APP_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token client ID does not match"
            )
        
        return claims
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )


def extract_bearer_token(authorization: Optional[str]) -> str:
    """
    Extract Bearer token from Authorization header.
    
    Args:
        authorization: Authorization header value
        
    Returns:
        The extracted JWT token
        
    Raises:
        HTTPException: If Authorization header is missing or malformed
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Check if it's a Bearer token
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with 'Bearer '",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Extract the token
    token = authorization[7:]  # Remove "Bearer " prefix
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return token


def get_user_info_from_token(claims: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract user information from verified token claims.
    
    Args:
        claims: Verified JWT claims
        
    Returns:
        Dict containing user information
    """
    return {
        'username': claims.get('username'),
        'email': claims.get('email'),
        'sub': claims.get('sub'),  # Cognito user ID
        'token_use': claims.get('token_use'),
        'client_id': claims.get('client_id'),
        'iss': claims.get('iss'),
        'exp': claims.get('exp'),
        'iat': claims.get('iat'),
        'scope': claims.get('scope', ''),
        'auth_time': claims.get('auth_time'),
        'cognito:groups': claims.get('cognito:groups', []),
        'cognito:roles': claims.get('cognito:roles', [])
    }
