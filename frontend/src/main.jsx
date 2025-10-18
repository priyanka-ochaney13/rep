import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import RepositoriesPage from './pages/Repositories.jsx';
import RepoDocsPage from './pages/RepoDocs.jsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function PrivateRoute({ children }) {
  const { user, setAuthModalOpen, setAuthModalTab } = useAuth();

  useEffect(() => {
    if (!user) {
      setAuthModalTab('login');
      setAuthModalOpen(true);
    }
  }, [user, setAuthModalOpen, setAuthModalTab]);

  if (!user) {
    // Render the landing (public) app while prompting auth instead of crashing render.
    return <App />;
  }
  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <RepoProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/repositories" element={<PrivateRoute><RepositoriesPage /></PrivateRoute>} />
            <Route path="/docs/:owner/:name" element={<PrivateRoute><RepoDocsPage /></PrivateRoute>} />
          </Routes>
        </RepoProvider>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
