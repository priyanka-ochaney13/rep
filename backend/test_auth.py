"""
Test script for AWS Cognito authentication in FastAPI backend.

This script tests the authentication endpoints without requiring a real JWT token.
Run this after starting the FastAPI server with: uvicorn main:app --reload
"""

import requests
import json

# Base URL for the FastAPI server
BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint (no auth required)."""
    print("Testing health check endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_protected_route_without_token():
    """Test protected route without authentication token."""
    print("\nTesting protected route without token...")
    try:
        response = requests.get(f"{BASE_URL}/protected")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 401
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_protected_route_with_invalid_token():
    """Test protected route with invalid token."""
    print("\nTesting protected route with invalid token...")
    try:
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = requests.get(f"{BASE_URL}/protected", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 401
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_user_profile_without_token():
    """Test user profile endpoint without authentication token."""
    print("\nTesting user profile endpoint without token...")
    try:
        response = requests.get(f"{BASE_URL}/user/profile")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 401
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_cors_headers():
    """Test CORS headers are properly set."""
    print("\nTesting CORS headers...")
    try:
        # Make a preflight request
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization"
        }
        response = requests.options(f"{BASE_URL}/protected", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_signup_endpoint():
    """Test signup endpoint with invalid data."""
    print("\nTesting signup endpoint...")
    try:
        # Test with invalid email format
        data = {
            "username": "invalid-email",
            "password": "TestPass123",
            "email": "invalid-email"
        }
        response = requests.post(f"{BASE_URL}/auth/signup", data=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        # Should return 400 for invalid email format
        return response.status_code in [400, 409]  # 409 if user already exists
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_confirm_signup_endpoint():
    """Test confirm signup endpoint with invalid data."""
    print("\nTesting confirm signup endpoint...")
    try:
        # Test with invalid confirmation code
        data = {
            "username": "test@example.com",
            "confirmation_code": "000000"
        }
        response = requests.post(f"{BASE_URL}/auth/confirm-signup", data=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        # Should return 400 for invalid code or 404 for user not found
        return response.status_code in [400, 404]
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_resend_confirmation_endpoint():
    """Test resend confirmation endpoint with invalid data."""
    print("\nTesting resend confirmation endpoint...")
    try:
        # Test with non-existent user
        data = {
            "username": "nonexistent@example.com"
        }
        response = requests.post(f"{BASE_URL}/auth/resend-confirmation", data=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        # Should return 404 for user not found
        return response.status_code == 404
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_signin_endpoint():
    """Test signin endpoint with invalid credentials."""
    print("\nTesting signin endpoint...")
    try:
        # Test with invalid credentials
        data = {
            "username": "test@example.com",
            "password": "wrongpassword"
        }
        response = requests.post(f"{BASE_URL}/auth/signin", data=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        # Should return 401 for invalid credentials or 404 for user not found
        return response.status_code in [401, 404]
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 50)
    print("AWS Cognito Authentication Test Suite")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("Protected Route (No Token)", test_protected_route_without_token),
        ("Protected Route (Invalid Token)", test_protected_route_with_invalid_token),
        ("User Profile (No Token)", test_user_profile_without_token),
        ("CORS Headers", test_cors_headers),
        ("Signup Endpoint", test_signup_endpoint),
        ("Confirm Signup Endpoint", test_confirm_signup_endpoint),
        ("Resend Confirmation Endpoint", test_resend_confirmation_endpoint),
        ("Signin Endpoint", test_signin_endpoint),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        if test_func():
            print(f"✅ {test_name} PASSED")
            passed += 1
        else:
            print(f"❌ {test_name} FAILED")
    
    print(f"\n{'='*50}")
    print(f"Test Results: {passed}/{total} tests passed")
    print(f"{'='*50}")
    
    if passed == total:
        print("🎉 All tests passed! Authentication is working correctly.")
        print("\nTo test with a real JWT token:")
        print("1. Sign in to your React frontend")
        print("2. Get the access token from the browser's localStorage or network tab")
        print("3. Use it in a request like:")
        print("   curl -H 'Authorization: Bearer YOUR_TOKEN_HERE' http://localhost:8000/protected")
    else:
        print("⚠️  Some tests failed. Check the server logs for more details.")

if __name__ == "__main__":
    main()
