# AWS Cognito Authentication Guide

This guide explains how to set up and use AWS Cognito authentication in the RepoX FastAPI backend.

## Overview

The backend now includes AWS Cognito JWT token verification with the following features:

- **JWT Token Verification**: Validates AWS Cognito access tokens
- **JWKS Caching**: Caches JSON Web Key Set for 1 hour to improve performance
- **CORS Configuration**: Allows requests from React frontend running on `http://localhost:5173`
- **Protected Routes**: Routes that require valid authentication
- **User Profile**: Endpoint to get current user information

## Configuration

### 1. Update Cognito Configuration

Edit `backend/app/utils/cognito_auth.py` and replace the placeholder values:

```python
# AWS Cognito Configuration
REGION = 'us-east-1'
USERPOOL_ID = 'us-east-1_YOUR_USERPOOL_ID'  # Replace with your actual User Pool ID
APP_CLIENT_ID = '17evshm31c2bi6id73efqjggn4'
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

The required packages are:
- `fastapi`
- `uvicorn`
- `python-multipart`
- `python-jose[cryptography]`
- `requests`

## Running the Backend

Start the FastAPI server:

```bash
cd backend
uvicorn main:app --reload
```

The server will start on `http://localhost:8000` with automatic reloading for development.

## API Endpoints

### Public Endpoints (No Authentication Required)

#### `GET /`
Health check endpoint.

**Response:**
```json
{
  "message": "Hello from FastAPI on Render!"
}
```

#### `POST /auth/signup`
Sign up a new user with email verification.

**Request Body (form-data):**
```
username: user@example.com
password: SecurePass123
email: user@example.com
```

**Response:**
```json
{
  "message": "User created successfully. Please check your email for verification code.",
  "username": "user@example.com",
  "user_confirmed": false,
  "next_step": "confirm_signup"
}
```

#### `POST /auth/confirm-signup`
Confirm user signup with verification code.

**Request Body (form-data):**
```
username: user@example.com
confirmation_code: 123456
```

**Response:**
```json
{
  "message": "Account confirmed successfully",
  "username": "user@example.com",
  "status": "confirmed"
}
```

#### `POST /auth/resend-confirmation`
Resend verification code to user's email.

**Request Body (form-data):**
```
username: user@example.com
```

**Response:**
```json
{
  "message": "Verification code sent successfully",
  "username": "user@example.com",
  "delivery_medium": "EMAIL"
}
```

#### `POST /auth/signin`
Sign in a user with email and password.

**Request Body (form-data):**
```
username: user@example.com
password: SecurePass123
```

**Response:**
```json
{
  "message": "Sign in successful",
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBMV81In0...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Protected Endpoints (Authentication Required)

#### `GET /protected`
Test endpoint that requires valid JWT token.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "message": "Access granted to protected resource",
  "user": {
    "username": "user@example.com",
    "email": "user@example.com",
    "sub": "cognito-user-id",
    "token_use": "access",
    "client_id": "17evshm31c2bi6id73efqjggn4",
    "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_YOUR_USERPOOL_ID",
    "exp": 1640995200,
    "iat": 1640991600,
    "scope": "aws.cognito.signin.user.admin",
    "auth_time": 1640991600,
    "cognito:groups": [],
    "cognito:roles": []
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### `GET /user/profile`
Get current user profile information.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "username": "user@example.com",
  "email": "user@example.com",
  "user_id": "cognito-user-id",
  "groups": [],
  "roles": [],
  "auth_time": 1640991600,
  "token_expires": 1640995200
}
```

#### `POST /generate`
Generate documentation (now requires authentication).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data
```

#### `POST /generate-and-download`
Generate and download documentation (now requires authentication).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data
```

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authorization header is required"
}
```

### 401 Unauthorized (Invalid Token)
```json
{
  "detail": "Token verification failed: Signature verification failed"
}
```

### 503 Service Unavailable (JWKS Fetch Error)
```json
{
  "detail": "Unable to fetch JWKS from Cognito: Connection timeout"
}
```

## Testing

### 1. Run the Test Suite

```bash
cd backend
python test_auth.py
```

This will test:
- Health check endpoint
- Protected routes without tokens
- CORS headers
- Error handling

### 2. Test with Real JWT Token

1. Sign in to your React frontend
2. Open browser developer tools
3. Go to Network tab and make a request
4. Copy the `Authorization` header value
5. Test with curl:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8000/protected
```

### 3. Test CORS

The backend is configured to allow requests from `http://localhost:5173`. Test CORS with:

```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS \
     http://localhost:8000/protected
```

## Complete Authentication Flow

### 1. User Signup Flow

```javascript
// Step 1: Sign up a new user
const signupResponse = await fetch('http://localhost:8000/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    username: 'user@example.com',
    password: 'SecurePass123',
    email: 'user@example.com'
  })
});

const signupData = await signupResponse.json();
// Response: { message: "User created successfully...", next_step: "confirm_signup" }
```

### 2. Email Verification Flow

```javascript
// Step 2: User enters verification code from email
const confirmResponse = await fetch('http://localhost:8000/auth/confirm-signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    username: 'user@example.com',
    confirmation_code: '123456'  // 6-digit code from email
  })
});

const confirmData = await confirmResponse.json();
// Response: { message: "Account confirmed successfully", status: "confirmed" }
```

### 3. User Signin Flow

```javascript
// Step 3: User signs in with verified account
const signinResponse = await fetch('http://localhost:8000/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    username: 'user@example.com',
    password: 'SecurePass123'
  })
});

const signinData = await signinResponse.json();
// Response: { access_token: "...", id_token: "...", refresh_token: "..." }
```

### 4. Making Authenticated Requests

```javascript
// Step 4: Use access token for protected endpoints
const token = signinData.access_token;

const protectedResponse = await fetch('http://localhost:8000/protected', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const protectedData = await protectedResponse.json();
// Response: { message: "Access granted...", user: {...}, timestamp: "..." }
```

### 5. Resending Verification Code (if needed)

```javascript
// If user didn't receive the verification code
const resendResponse = await fetch('http://localhost:8000/auth/resend-confirmation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    username: 'user@example.com'
  })
});

const resendData = await resendResponse.json();
// Response: { message: "Verification code sent successfully", delivery_medium: "EMAIL" }
```

## Frontend Integration

Your React frontend should include the JWT token in API requests:

```javascript
// Example: Making authenticated requests
const token = await getCurrentUser().then(user => 
  user.signInUserSession.accessToken.jwtToken
);

const response = await fetch('http://localhost:8000/protected', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Security Features

### JWKS Caching
- JWKS (JSON Web Key Set) is cached for 1 hour
- Reduces API calls to AWS Cognito
- Improves response times

### Token Validation
- Verifies JWT signature using Cognito's public keys
- Validates token expiration
- Checks token issuer matches your User Pool
- Ensures token type is "access"
- Verifies client ID matches your app client

### CORS Protection
- Only allows requests from `http://localhost:5173`
- Supports credentials for authenticated requests
- Allows necessary HTTP methods and headers

## Troubleshooting

### Common Issues

1. **"Unable to fetch JWKS from Cognito"**
   - Check your internet connection
   - Verify the USERPOOL_ID is correct
   - Ensure the User Pool exists in the specified region

2. **"Token verification failed"**
   - Token may be expired
   - Token may be from a different User Pool
   - Token may be an ID token instead of access token

3. **CORS errors in browser**
   - Ensure frontend is running on `http://localhost:5173`
   - Check that CORS headers are being sent correctly

### Debug Mode

To enable debug logging, add this to your FastAPI app:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Production Considerations

1. **Environment Variables**: Move configuration to environment variables
2. **HTTPS**: Use HTTPS in production
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Logging**: Add proper logging for security events
5. **Monitoring**: Monitor authentication failures and JWKS fetch errors

## Next Steps

1. Update your Cognito User Pool ID in the configuration
2. Test the authentication flow with your React frontend
3. Add additional protected routes as needed
4. Implement role-based access control if required
