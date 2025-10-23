import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { getUserHistory, generateDocs, deleteDocumentation, checkRepoUpdates, regenerateDocumentation } from '../api/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

// --- Types / Constants --------------------------------------------------
// Status flow: Pending -> Processing -> Ready | Failed

function todayISO() { return new Date().toISOString().split('T')[0]; }

/**
 * Transform DynamoDB documentation record to frontend repo format
 */
function transformDynamoDBRecordToRepo(record) {
  // Extract repo name and owner from URL
  let name = 'Unknown';
  let owner = 'Unknown';
  
  if (record.repoUrl) {
    if (record.repoUrl.includes('github.com')) {
      try {
        const match = record.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
          owner = match[1];
          name = match[2];
        }
      } catch (e) {
        console.warn('Failed to parse repo URL:', e);
      }
    } else if (record.repoUrl.includes('zip_upload')) {
      name = 'Zip Upload';
      owner = 'local';
    }
  }
  
  // Get metadata
  const metadata = record.metadata || {};
  
  return {
    id: record.recordId,
    name: name,
    owner: owner,
    description: '', // Could extract from README later
    stars: 0,
    lang: metadata.input_type === 'url' ? 'Unknown' : 'Mixed',
    status: 'Ready', // All DynamoDB records are completed
    updatedAt: record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : todayISO(),
    hasUpdates: record.hasUpdates || false, // Check if repo has available updates
    commitsBehind: 0, // Will be populated when checking updates
    updateMessage: '', // Will be populated when checking updates
    docs: {
      readme: record.readmeContent || '',
      summary: record.summaries || {},
      changelog: [],
      visuals: metadata.visuals || {},
      folderTree: metadata.folder_tree || '',
      projectAnalysis: metadata.project_analysis || {}
    }
  };
}

const ACTIONS = {
  LOAD: 'LOAD',
  ADD: 'ADD',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

function repoReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.LOAD:
      return { ...state, repos: action.payload, loading: false, error: null };
    case ACTIONS.ADD:
      return { ...state, repos: [action.payload, ...state.repos] };
    case ACTIONS.UPDATE:
      return { 
        ...state, 
        repos: state.repos.map(r => 
          r.id === action.id 
            ? { ...r, ...action.patch, docs: { ...r.docs, ...(action.patch.docs || {}) } } 
            : r
        ) 
      };
    case ACTIONS.DELETE:
      return { ...state, repos: state.repos.filter(r => r.id !== action.id) };
    default:
      return state;
  }
}

const RepoContext = createContext(null);

export function RepoProvider({ children }) {
  const { user, hasCheckedAuth } = useAuth();
  const [state, dispatch] = useReducer(repoReducer, { 
    repos: [], 
    loading: true, 
    error: null 
  });

  const fetchReposFromDynamoDB = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!user) {
      dispatch({ type: ACTIONS.LOAD, payload: [] });
      return { success: false, reason: 'not_authenticated' };
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      // Fetch all documentation records from DynamoDB
      const history = await getUserHistory(100); // Get up to 100 records
      
      // Transform DynamoDB records to repo format
      const repos = history.map(record => transformDynamoDBRecordToRepo(record));
      
      dispatch({ type: ACTIONS.LOAD, payload: repos });
      
      return { success: true, count: repos.length };
      
    } catch (error) {
      console.error('❌ Failed to fetch repositories from DynamoDB:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to load repositories. Please try again.' });
      dispatch({ type: ACTIONS.LOAD, payload: [] }); // Load empty array on error
      return { success: false, error: error.message };
    }
  }, [user]);

  // Fetch repos when user authentication changes
  useEffect(() => {
    // Wait for auth check to complete
    if (!hasCheckedAuth) {
      return;
    }
    
    // If user is authenticated, fetch repos
    if (user) {
      fetchReposFromDynamoDB();
    } else {
      // User is not authenticated, clear repos
      dispatch({ type: ACTIONS.LOAD, payload: [] });
    }
  }, [user, hasCheckedAuth, fetchReposFromDynamoDB]);

  // --- Actions ---------------------------------------------------------

  const updateRepo = useCallback((id, patch) => {
    dispatch({ type: ACTIONS.UPDATE, id, patch });
  }, []);

  const deleteRepo = useCallback(async (id) => {
    try {
      // Delete from DynamoDB
      const result = await deleteDocumentation(id);
      
      // Check if delete was successful
      if (result.status === 'error') {
        throw new Error(result.message || 'Failed to delete from DynamoDB');
      }
      
      // Remove from local state immediately
      dispatch({ type: ACTIONS.DELETE, id });
      
    } catch (error) {
      console.error('❌ Failed to delete from DynamoDB:', error);
      console.error('Error details:', error.message, error.stack);
      throw error; // Let the UI handle the error
    }
  }, []);

  const connectRepo = useCallback(async (githubUrl, manual = {}) => {
    let owner, name;
    try {
      const u = new URL(githubUrl);
      if (u.hostname !== 'github.com') throw new Error('Not GitHub');
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length < 2) throw new Error('Bad path');
      [owner, name] = parts;
    } catch {
      return { error: 'Invalid GitHub URL' };
    }
    
    // Create temporary ID
    const tempId = `temp-${owner}-${name}-${Date.now()}`;
    
    // Add as "Processing" immediately for UI feedback
    const newRepo = {
      id: tempId,
      name,
      owner,
      description: manual.description || '',
      stars: 0,
      lang: 'Unknown',
      status: 'Processing',
      updatedAt: todayISO(),
      docs: {
        readme: '',
        summary: {},
        changelog: []
      }
    };
    
    dispatch({ type: ACTIONS.ADD, payload: newRepo });
    
    try {
      // Call backend to generate docs - it will save to DynamoDB
      await generateDocs({
        inputType: 'url',
        inputData: githubUrl,
        branch: manual.branch || 'main'
      });
      
      // Refresh from DynamoDB to get the new record with real ID
      await fetchReposFromDynamoDB();
      
      return { id: tempId };
    } catch (error) {
      console.error('❌ Failed to generate documentation:', error);
      
      // Update status to Failed
      updateRepo(tempId, { status: 'Failed' });
      
      // Provide more detailed error messages
      let errorMessage = 'Failed to generate documentation';
      
      if (error.message) {
        if (error.message.includes('Branch') && error.message.includes('not found')) {
          errorMessage = `Branch "${manual.branch || 'main'}" not found. Please check the branch name and try again.`;
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'GitHub API rate limit exceeded. Please try again later or contact support to add a token.';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = 'Repository not found. Please check the URL and ensure the repository is public.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { error: errorMessage };
    }
  }, [fetchReposFromDynamoDB, updateRepo]);

  const retryGeneration = useCallback(async (id) => {
    // Find the repo
    const repo = state.repos.find(r => r.id === id);
    if (!repo) return;
    
    // Update status to Processing
    updateRepo(id, { status: 'Processing' });
    
    // Retry generation
    const githubUrl = `https://github.com/${repo.owner}/${repo.name}`;
    await connectRepo(githubUrl, {});
  }, [state.repos, updateRepo, connectRepo]);

  const checkForUpdates = useCallback(async (id) => {
    try {
      console.log(`🔍 Checking for updates: ${id}`);
      const updateInfo = await checkRepoUpdates(id);
      
      // Update repo with hasUpdates flag
      if (updateInfo.has_updates) {
        updateRepo(id, { 
          hasUpdates: true,
          commitsBehind: updateInfo.commits_behind,
          updateMessage: updateInfo.message
        });
      }
      
      return updateInfo;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return { has_updates: false, error: error.message };
    }
  }, [updateRepo]);

  const regenerateRepo = useCallback(async (id) => {
    try {
      console.log(`🔄 Regenerating documentation: ${id}`);
      
      // Update status to Processing
      updateRepo(id, { status: 'Processing', hasUpdates: false });
      
      // Call regenerate API
      const result = await regenerateDocumentation(id);
      
      // Refresh from DynamoDB to get updated data
      await fetchReposFromDynamoDB();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to regenerate documentation:', error);
      
      // Update status back to Ready but with error
      updateRepo(id, { status: 'Failed' });
      
      return { error: error.message || 'Failed to regenerate documentation' };
    }
  }, [updateRepo, fetchReposFromDynamoDB]);

  const value = {
    repos: state.repos,
    loading: state.loading,
    error: state.error,
    connectRepo,
    updateRepo,
    retryGeneration,
    deleteRepo,
    refreshRepos: fetchReposFromDynamoDB,
    checkForUpdates,
    regenerateRepo
  };

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepos() {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useRepos must be used within RepoProvider');
  return ctx;
}
