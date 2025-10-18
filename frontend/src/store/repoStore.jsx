import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// --- Types / Constants --------------------------------------------------
// Status flow: Pending -> Processing -> Ready | Failed

const INITIAL_SEED = [
  {
    id: 'seed-dsa-prac',
    name: 'DSA-prac',
    owner: 'priyanka-ochaney13',
    description: 'Practice data structures & algorithms.',
    stars: 0,
    lang: 'JavaScript',
    status: 'Ready',
    updatedAt: '2025-10-04',
    docs: {
      readme: '# DSA-prac\n\nThis repository contains data structure & algorithm practice solutions.\n',
      summary: 'Includes solutions for arrays, graphs, trees, and more.',
      changelog: [
        { date: '2025-10-04', entry: 'Added new graph algorithms.' },
        { date: '2025-09-20', entry: 'Refactored tree traversal utilities.' },
        { date: '2025-09-01', entry: 'Initial auto-generated docs.' }
      ]
    }
  },
  {
    id: 'seed-repox',
    name: 'repox',
    owner: 'priyanka-ochaney13',
    description: 'RepoX core service.',
    stars: 0,
    lang: 'TypeScript',
    status: 'Ready',
    updatedAt: '2025-10-04',
    docs: { readme: '# RepoX\nCore service powering automated documentation.\n', summary: 'Core logic & automation pipeline.', changelog: [] }
  },
  {
    id: 'seed-api-gateway',
    name: 'api-gateway',
    owner: 'acme',
    description: 'Scalable API gateway with rate limiting and authentication',
    stars: 156,
    lang: 'Go',
    status: 'Ready',
    updatedAt: '2024-01-14',
    docs: { readme: '# API Gateway\nHigh-performance gateway written in Go.\n', summary: 'Gateway modules & middleware overview.', changelog: [] }
  }
];

const STORAGE_KEY = 'repox.repos.v1';

function todayISO() { return new Date().toISOString().split('T')[0]; }

// --- Reducer ------------------------------------------------------------

const ACTIONS = {
  LOAD: 'LOAD',
  ADD: 'ADD',
  UPDATE: 'UPDATE'
};

function repoReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD:
      return action.payload;
    case ACTIONS.ADD:
      return [action.payload, ...state];
    case ACTIONS.UPDATE:
      return state.map(r => r.id === action.id ? { ...r, ...action.patch, docs: { ...r.docs, ...(action.patch.docs || {}) } } : r);
    default:
      return state;
  }
}

const RepoContext = createContext(null);

export function RepoProvider({ children }) {
  const [repos, dispatch] = useReducer(repoReducer, []);

  // Load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          dispatch({ type: ACTIONS.LOAD, payload: parsed });
          return;
        }
      }
    } catch { /* ignore */ }
    dispatch({ type: ACTIONS.LOAD, payload: INITIAL_SEED });
  }, []);

  // Persist anytime repos changes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(repos)); } catch { /* ignore */ }
  }, [repos]);

  // --- Actions ---------------------------------------------------------

  const updateRepo = React.useCallback((id, patch) => {
    dispatch({ type: ACTIONS.UPDATE, id, patch });
  }, []);

  const simulateGeneration = React.useCallback((id) => {
    updateRepo(id, { status: 'Processing' });
    const duration = 1200 + Math.random() * 2000;
    setTimeout(() => {
      const failed = Math.random() < 0.08; // 8% failure chance
      if (failed) {
        updateRepo(id, { status: 'Failed' });
        return;
      }
      updateRepo(id, {
        status: 'Ready',
        docs: {
          summary: 'Automated summary generated on ' + new Date().toLocaleString(),
          changelog: [{ date: todayISO(), entry: 'Initial auto-generated docs.' }]
        }
      });
    }, duration);
  }, [updateRepo]);

  const fetchGitHubMeta = React.useCallback(async (id, owner, name) => {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${name}`);
      if (!res.ok) return; // rate limit or not found
      const json = await res.json();
      updateRepo(id, {
        stars: json.stargazers_count || 0,
        lang: json.language || 'Unknown',
        description: json.description || '',
        updatedAt: json.updated_at ? json.updated_at.split('T')[0] : todayISO()
      });
    } catch { /* ignore network errors */ }
  }, [updateRepo]);

  const connectRepo = React.useCallback(async (githubUrl, manual = {}) => {
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
    const id = `${owner}-${name}-${Date.now()}`;
    const newRepo = {
      id,
      name,
      owner,
      description: manual.description || '',
      stars: Number(manual.stars) || 0,
      lang: manual.language || 'JavaScript',
      status: 'Pending',
      updatedAt: todayISO(),
      docs: {
        readme: `# ${name}\n\nAuto-generated placeholder README.\n`,
        summary: '',
        changelog: []
      }
    };
    dispatch({ type: ACTIONS.ADD, payload: newRepo });
    // Kick off async tasks
    simulateGeneration(id);
    fetchGitHubMeta(id, owner, name);
    return { id };
  }, [simulateGeneration, fetchGitHubMeta]);

  const retryGeneration = React.useCallback((id) => {
    updateRepo(id, { status: 'Pending' });
    simulateGeneration(id);
  }, [simulateGeneration, updateRepo]);

  const value = {
    repos,
    connectRepo,
    updateRepo,
    retryGeneration
  };

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepos() {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useRepos must be used within RepoProvider');
  return ctx;
}
