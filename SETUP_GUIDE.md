# RepoX Setup Guide

This guide will help you set up the RepoX application with AWS Cognito authentication.

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ installed
- AWS Account with Cognito User Pool configured

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
cp env.example .env
```

Edit the `.env` file with your actual values:

```env
# AWS Configuration
AWS_REGION=us-east-1

# AWS Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_YOUR_ACTUAL_USERPOOL_ID
COGNITO_APP_CLIENT_ID=YOUR_ACTUAL_APP_CLIENT_ID
```

### 3. Run Backend

```bash
python -m uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `frontend` directory:

```bash
cp env.example .env
```

Edit the `.env` file with your actual values:

```env
# AWS Cognito Configuration for Frontend
VITE_COGNITO_USER_POOL_ID=us-east-1_YOUR_ACTUAL_USERPOOL_ID
VITE_COGNITO_APP_CLIENT_ID=YOUR_ACTUAL_APP_CLIENT_ID

# Backend API URL (for development)
VITE_API_URL=http://localhost:8000
```

### 3. Run Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## AWS Cognito Configuration

### Required Cognito Settings

1. **User Pool ID**: Found in AWS Cognito Console
2. **App Client ID**: Found in your Cognito User Pool's App Integration tab
3. **Region**: AWS region where your Cognito User Pool is located

### Cognito User Pool Configuration

- **Sign-in options**: Email
- **Password policy**: Minimum 8 characters, uppercase, lowercase, numbers
- **MFA**: Optional (not required for this setup)
- **User account recovery**: Email only
- **App client settings**: 
  - Enable username-password flow
  - Enable email verification

## Security Notes

- Never commit `.env` files to version control
- Use environment variables for all sensitive configuration
- The `env.example` files show the required variables without exposing secrets
- AWS credentials should be configured via IAM roles or AWS CLI, not in environment files

## Testing

### Backend API Testing

```bash
cd backend
python test_auth.py
```

### Frontend Testing

1. Open `http://localhost:5173`
2. Try signing up with a new email
3. Check your email for verification code
4. Enter the code to verify your account
5. Sign in with your verified credentials

## Deployment

### Backend Deployment

- Use environment variables in your deployment platform
- Ensure AWS credentials are configured
- Set CORS origins to your frontend domain

### Frontend Deployment

- Build the project: `npm run build`
- Deploy the `dist` folder to your hosting platform
- Set environment variables in your deployment platform

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Run `pip install -r requirements.txt` again
2. **CORS errors**: Ensure backend CORS is configured for your frontend URL
3. **Authentication errors**: Verify your Cognito configuration matches your `.env` files
4. **Environment variables not loading**: Ensure `.env` files are in the correct directories

### Getting Help

- Check the browser console for frontend errors
- Check the backend logs for server errors
- Verify your AWS Cognito configuration
- Ensure all environment variables are set correctly
