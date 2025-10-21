import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import RepositoriesPage from './pages/Repositories.jsx';
import RepoDocsPage from './pages/RepoDocs.jsx';
import FeaturesPage from './pages/Features.jsx';
import Profile from './components/Profile.jsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RepoProvider } from './store/repoStore.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Amplify } from 'aws-amplify'
import awsConfig from './aws-config'

// Configure Amplify with Cognito (v6 API)
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: awsConfig.aws_user_pools_id,
      userPoolClientId: awsConfig.aws_user_pools_web_client_id,
      loginWith: {
        email: true,
      }
    }
  }
})

// Private route wrapper - redirects to home if not authenticated
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#8b949e'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Public route wrapper - redirects to repositories if already authenticated
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#8b949e'
      }}>
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/repositories" replace />;
  }

  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <RepoProvider>
          <Routes>
            <Route path="/" element={<PublicRoute><App /></PublicRoute>} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/repositories" element={<PrivateRoute><RepositoriesPage /></PrivateRoute>} />
            <Route path="/docs/:owner/:name" element={<PrivateRoute><RepoDocsPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </RepoProvider>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
