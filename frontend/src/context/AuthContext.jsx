import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser,
  fetchUserAttributes,
  confirmSignUp
} from 'aws-amplify/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [redirectPath, setRedirectPath] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  // Check if user is authenticated on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setUser({
        username: currentUser.username,
        email: attributes.email,
        displayName: attributes.name || attributes.email?.split('@')[0],
      });
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email, password) => {
    setError('');
    try {
      await signIn({ username: email, password });
      await checkUser();
    } catch (err) {
      throw err;
    }
  };

  const signupWithEmail = async (email, password) => {
    setError('');
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        }
      });

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        // User needs to confirm their email - show verification step
        setNeedsVerification(true);
        setPendingEmail(email);
        setError('Please check your email for the verification code');
        return { needsVerification: true }; // Return status
      }

      if (isSignUpComplete) {
        await checkUser();
        return { needsVerification: false }; // Signup complete
      }
    } catch (err) {
      throw err;
    }
  };


  const confirmSignupWithCode = async (email, code) => {
    setError('');
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      setNeedsVerification(false);
      setPendingEmail('');
      setError('');
      // After successful confirmation, switch to login tab
      setAuthModalTab('login');
    } catch (err) {
      throw err;
    }
  };

  const resendVerificationCode = async (email) => {
    setError('');
    try {
      // Note: AWS Amplify doesn't have a direct resend function in v6
      // We'll need to use the backend endpoint for this
      const response = await fetch('http://localhost:8000/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to resend verification code');
      }

      const data = await response.json();
      setError('Verification code sent successfully! Please check your email.');
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    error,
    setError,
    isAuthModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    redirectPath,
    setRedirectPath,
    needsVerification,
    setNeedsVerification,
    pendingEmail,
    setPendingEmail,
    loginWithEmail,
    signupWithEmail,
    confirmSignupWithCode,
    resendVerificationCode,
    logout,
  }), [user, loading, error, isAuthModalOpen, authModalTab, redirectPath, needsVerification, pendingEmail]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


