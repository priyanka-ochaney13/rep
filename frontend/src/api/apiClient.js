/**
 * Authenticated API Client for Backend Communication
 * 
 * This module provides utilities for making authenticated API requests to the backend.
 * It automatically includes JWT tokens from AWS Cognito in all requests.
 */

import { fetchAuthSession } from 'aws-amplify/auth';

// Get API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get the current user's JWT access token
 * @returns {Promise<string|null>} JWT token or null if not authenticated
 */
async function getAuthToken() {
  try {
    const session = await fetchAuthSession();
    
    // Debug: Log what tokens we have
    console.log('Session tokens:', {
      hasAccessToken: !!session.tokens?.accessToken,
      hasIdToken: !!session.tokens?.idToken,
    });
    
    // Use accessToken for API authentication
    const token = session.tokens?.accessToken?.toString();
    
    if (!token) {
      console.warn('No access token available in session');
      return null;
    }
    
    // Debug: Log first few characters of token
    console.log('Token retrieved:', token.substring(0, 20) + '...');
    
    return token;
  } catch (error) {
    console.error('Error getting authentication token:', error);
    return null;
  }
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/user/profile')
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} Response data
 * @throws {Error} If request fails
 */
export async function apiRequest(endpoint, options = {}) {
  try {
    // Get the JWT token
    const token = await getAuthToken();
    
    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add Authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`Making authenticated request to ${endpoint}`);
    } else {
      console.warn(`No token available for request to ${endpoint}`);
    }
    
    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    // Handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || response.statusText || 'Request failed';
      console.error(`API Error [${response.status}]:`, errorMessage);
      throw new Error(errorMessage);
    }
    
    // Return JSON response
    const data = await response.json();
    console.log(`API Success for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

/**
 * Make an authenticated API request with FormData
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - Form data to send
 * @returns {Promise<any>} Response data
 */
export async function apiRequestFormData(endpoint, formData) {
  try {
    const token = await getAuthToken();
    
    const headers = {};
    
    // Add Authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Note: Don't set Content-Type for FormData - browser will set it with boundary
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || response.statusText || 'Request failed';
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

/**
 * Upload a file to generate documentation
 * @param {Object} params - Upload parameters
 * @param {string} params.inputType - Type of input ('url', 'zip', etc.)
 * @param {string} params.inputData - Input data (URL, etc.)
 * @param {File} params.zipFile - Zip file (if input type is 'zip')
 * @param {string} params.branch - Git branch name
 * @param {boolean} params.commitToGithub - Whether to commit README to GitHub
 * @returns {Promise<any>} Documentation generation result
 */
export async function generateDocs({ inputType, inputData, zipFile, branch, commitToGithub = false }) {
  const formData = new FormData();
  formData.append('input_type', inputType);
  
  if (inputData) {
    formData.append('input_data', inputData);
  }
  
  if (zipFile) {
    formData.append('zip_file', zipFile);
  }
  
  if (branch) {
    formData.append('branch', branch);
  }
  
  formData.append('commit_to_github', commitToGithub.toString());
  
  return apiRequestFormData('/generate', formData);
}

/**
 * Commit README to GitHub without regenerating documentation
 * @param {Object} params - Commit parameters
 * @param {string} params.inputData - GitHub repository URL
 * @param {string} params.readmeContent - README content to commit
 * @param {string} params.branch - Git branch name
 * @returns {Promise<any>} Commit result
 */
export async function commitReadme({ inputData, readmeContent, branch = 'main' }) {
  const formData = new FormData();
  formData.append('input_data', inputData);
  formData.append('readme_content', readmeContent);
  formData.append('branch', branch);
  
  return apiRequestFormData('/commit-readme', formData);
}

/**
 * Get user profile from backend
 * @returns {Promise<any>} User profile data
 */
export async function getUserProfile() {
  return apiRequest('/user/profile');
}

/**
 * Test protected endpoint
 * @returns {Promise<any>} Protected resource data
 */
export async function testProtectedEndpoint() {
  return apiRequest('/protected');
}

export { API_BASE_URL };
