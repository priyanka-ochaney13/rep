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
 * @returns {Promise<any>} Documentation generation result
 */
export async function generateDocs({ inputType, inputData, zipFile, branch }) {
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
  
  return apiRequestFormData('/generate', formData);
}

/**
 * Get user profile from backend
 * @param {string} params.readmeContent - README content to commit
 * @param {string} params.branch - Git branch name
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

/**
 * Get user's documentation generation history from DynamoDB
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} Array of documentation history records
 */
export async function getUserHistory(limit = 10) {
  try {
    console.log(`📡 Fetching user history from DynamoDB (limit: ${limit})...`);
    const response = await apiRequest(`/user/history?limit=${limit}`);
    console.log(`✅ DynamoDB returned ${response.history?.length || 0} records`);
    return response.history || [];
  } catch (error) {
    console.error('❌ Failed to fetch history from DynamoDB:', error);
    console.error('   Error details:', error.message);
    console.error('   This could mean:');
    console.error('   1. AWS Learners Lab session expired');
    console.error('   2. Not authenticated (no valid JWT token)');
    console.error('   3. Backend server not running');
    console.error('   4. DynamoDB credentials invalid');
    return []; // Return empty array on error - won't crash the app
  }
}

/**
 * Get a specific documentation record by ID from DynamoDB
 * @param {string} recordId - Documentation record ID
 * @returns {Promise<any>} Documentation record or null
 */
export async function getDocumentationById(recordId) {
  try {
    return await apiRequest(`/user/documentation/${recordId}`);
  } catch (error) {
    console.warn('Failed to fetch documentation record:', error);
    return null; // Return null on error - won't crash the app
  }
}

/**
 * Delete a documentation record from DynamoDB
 * @param {string} recordId - Documentation record ID to delete
 * @returns {Promise<any>} Deletion result
 */
export async function deleteDocumentation(recordId) {
  try {
    // Encode the recordId to handle special characters like # in DOC#timestamp#hash
    const encodedRecordId = encodeURIComponent(recordId);
    return await apiRequest(`/user/documentation/${encodedRecordId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.warn('Failed to delete documentation record:', error);
    throw error; // Throw so UI can show error message
  }
}

/**
 * Get user preferences from DynamoDB
 * @returns {Promise<any>} User preferences
 */
export async function getUserPreferences() {
  try {
    return await apiRequest('/user/preferences');
  } catch (error) {
    console.warn('Failed to fetch user preferences:', error);
    return null; // Return null on error - won't crash the app
  }
}

/**
 * Save user preferences to DynamoDB
 * @param {Object} preferences - Preferences object
 * @returns {Promise<any>} Save result
 */
export async function saveUserPreferences(preferences) {
  try {
    return await apiRequest('/user/preferences', {
      method: 'POST',
      body: JSON.stringify(preferences)
    });
  } catch (error) {
    console.warn('Failed to save user preferences:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Check if a repository has updates since last documentation generation
 * @param {string} recordId - Documentation record ID to check
 * @returns {Promise<any>} Update information
 */
export async function checkRepoUpdates(recordId) {
  try {
    const encodedRecordId = encodeURIComponent(recordId);
    return await apiRequest(`/user/documentation/${encodedRecordId}/check-updates`, {
      method: 'POST'
    });
  } catch (error) {
    console.warn('Failed to check repository updates:', error);
    return { has_updates: false, error: error.message };
  }
}

/**
 * Regenerate documentation for a repository
 * @param {string} recordId - Documentation record ID to regenerate
 * @returns {Promise<any>} Regeneration result with updated documentation
 */
export async function regenerateDocumentation(recordId) {
  try {
    const encodedRecordId = encodeURIComponent(recordId);
    return await apiRequest(`/user/documentation/${encodedRecordId}/regenerate`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Failed to regenerate documentation:', error);
    throw error; // Throw so UI can show error message
  }
}

export { API_BASE_URL };
