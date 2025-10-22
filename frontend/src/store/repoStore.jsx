import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { getUserHistory, generateDocs, deleteDocumentation } from '../api/apiClient.js';

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
    docs: {
      readme: record.readmeContent || '',
      summary: record.summaries || {},
      changelog: [],
      visuals: metadata.visuals || {},
      folderTree: metadata.folder_tree || '',
      projectAnalysis: metadata.project_analysis || {}
    },
    commitStatus: metadata.commit_status,
    commitMessage: metadata.commit_message
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
  const [state, dispatch] = useReducer(repoReducer, { 
    repos: [], 
    loading: true, 
    error: null 
  });

  const fetchReposFromDynamoDB = useCallback(async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      console.log('🔄 Fetching repositories from DynamoDB...');
      
      // Fetch all documentation records from DynamoDB
      const history = await getUserHistory(100); // Get up to 100 records
      
      console.log(`✅ Fetched ${history.length} records from DynamoDB`);
      
      // Transform DynamoDB records to repo format
      const repos = history.map(record => transformDynamoDBRecordToRepo(record));
      
      dispatch({ type: ACTIONS.LOAD, payload: repos });
      
      console.log(`✅ Loaded ${repos.length} repositories`);
      
    } catch (error) {
      console.error('❌ Failed to fetch repositories from DynamoDB:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to load repositories. Please try again.' });
      dispatch({ type: ACTIONS.LOAD, payload: [] }); // Load empty array on error
    }
  }, []);

  // Fetch repos from DynamoDB on mount
  useEffect(() => {
    fetchReposFromDynamoDB();
  }, [fetchReposFromDynamoDB]);

  // --- Actions ---------------------------------------------------------

  const updateRepo = useCallback((id, patch) => {
    dispatch({ type: ACTIONS.UPDATE, id, patch });
  }, []);

  const deleteRepo = useCallback(async (id) => {
    try {
      console.log('🗑️ Deleting repo from DynamoDB:', id);
      
      // Delete from DynamoDB
      const result = await deleteDocumentation(id);
      
      console.log('✅ DynamoDB delete result:', result);
      
      // Check if delete was successful
      if (result.status === 'error') {
        throw new Error(result.message || 'Failed to delete from DynamoDB');
      }
      
      // Remove from local state immediately
      dispatch({ type: ACTIONS.DELETE, id });
      
      console.log('✅ Removed from local state');
      
      // Don't refetch immediately - let the user manually refresh if needed
      // This avoids race conditions with DynamoDB eventual consistency
      
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
      console.log('🚀 Generating documentation...');
      await generateDocs({
        inputType: 'url',
        inputData: githubUrl,
        branch: 'main',
        commitToGithub: manual.commitToGithub || false
      });
      
      console.log('✅ Documentation generated successfully');
      
      // Refresh from DynamoDB to get the new record with real ID
      await fetchReposFromDynamoDB();
      
      return { id: tempId };
    } catch (error) {
      console.error('❌ Failed to generate documentation:', error);
      
      // Update status to Failed
      updateRepo(tempId, { status: 'Failed' });
      
      return { error: error.message || 'Failed to generate documentation' };
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
    await connectRepo(githubUrl, { commitToGithub: false });
  }, [state.repos, updateRepo, connectRepo]);

  const value = {
    repos: state.repos,
    loading: state.loading,
    error: state.error,
    connectRepo,
    updateRepo,
    retryGeneration,
    deleteRepo,
    refreshRepos: fetchReposFromDynamoDB
  };

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepos() {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useRepos must be used within RepoProvider');
  return ctx;
}
