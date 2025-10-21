import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    loginWithEmail,
    signupWithEmail,
    confirmSignupWithCode,
    resendVerificationCode,
    error,
    setError,
    redirectPath,
    needsVerification,
    setNeedsVerification,
    pendingEmail,
    setPendingEmail,
  } = useAuth();
  const navigate = (path) => {
    try { window.history.pushState({}, '', path); } catch {}
    // No hard navigation here; routing handled in app. This is just a soft push.
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const close = () => {
    if (submitting) return;
    setError('');
    setNeedsVerification(false);
    setPendingEmail('');
    setVerificationCode('');
    setAuthModalOpen(false);
    if (redirectPath) navigate(redirectPath);
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await loginWithEmail(email, password);
      close();
    } catch (err) {
      setError(mapCognitoError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await signupWithEmail(email, password);
      // If signup is complete and no verification needed, close modal
      if (result && !result.needsVerification) {
        close();
      }
      // If verification is needed, the modal will stay open and show verification step
    } catch (err) {
      setError(mapCognitoError(err));
    } finally {
      setSubmitting(false);
    }
  };


  const onVerifyCode = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await confirmSignupWithCode(pendingEmail, verificationCode);
      setVerificationCode('');
      // Modal will switch to login tab automatically
    } catch (err) {
      setError(mapCognitoError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onResendCode = async () => {
    setSubmitting(true);
    setError('');
    try {
      await resendVerificationCode(pendingEmail);
    } catch (err) {
      setError(mapCognitoError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">★</span>
            <h2>Welcome to RepoX</h2>
          </div>
          <button onClick={close} className="modal-close">✕</button>
        </div>

        {!needsVerification && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.5rem',background:'#0c1524',border:'1px solid #1f2b3b',borderRadius:'.6rem',padding:'.25rem',marginBottom:'1rem'}}>
            <button onClick={() => setAuthModalTab('login')} style={tabStyle(authModalTab==='login')}>Login</button>
            <button onClick={() => setAuthModalTab('signup')} style={tabStyle(authModalTab==='signup')}>Sign Up</button>
          </div>
        )}

        {error && (
          <div style={{marginBottom:'.8rem',background:'#220e10',border:'1px solid #3f1d20',color:'#f87171',borderRadius:'.6rem',padding:'.5rem .7rem',fontSize:'.8rem'}}>{error}</div>
        )}

        {needsVerification ? (
          <div>
            <div style={{marginBottom:'1rem',textAlign:'center'}}>
              <h3 style={{color:'#d0d7e2',marginBottom:'.5rem'}}>Verify Your Email</h3>
              <p style={{color:'#8b949e',fontSize:'.9rem'}}>
                We sent a verification code to <strong>{pendingEmail}</strong>
              </p>
            </div>
            <form onSubmit={onVerifyCode} className="modal-form">
              <div className="field-group">
                <label className="field-label">Verification Code</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    required 
                    placeholder="123456" 
                    value={verificationCode} 
                    onChange={(e)=>setVerificationCode(e.target.value)}
                    maxLength="6"
                    style={{textAlign:'center',letterSpacing:'0.5rem'}}
                  />
                </div>
              </div>
              <div className="modal-actions" style={{justifyContent:'stretch'}}>
                <button disabled={submitting} className="btn-primary" style={{width:'100%', justifyContent:'center'}}>
                  {submitting ? 'Verifying...' : 'Verify Email'}
                </button>
              </div>
              <div style={{textAlign:'center',marginTop:'1rem'}}>
                <button 
                  type="button" 
                  onClick={onResendCode} 
                  disabled={submitting}
                  style={{
                    background:'transparent',
                    border:'1px solid #1f2b3b',
                    color:'#8b949e',
                    padding:'.5rem 1rem',
                    borderRadius:'.5rem',
                    cursor:submitting?'not-allowed':'pointer',
                    fontSize:'.8rem',
                    marginRight:'.5rem'
                  }}
                >
                  {submitting ? 'Sending...' : "Didn't receive code? Resend"}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setNeedsVerification(false);
                    setPendingEmail('');
                    setVerificationCode('');
                    setError('');
                    setAuthModalTab('signup');
                  }}
                  disabled={submitting}
                  style={{
                    background:'transparent',
                    border:'1px solid #1f2b3b',
                    color:'#8b949e',
                    padding:'.5rem 1rem',
                    borderRadius:'.5rem',
                    cursor:submitting?'not-allowed':'pointer',
                    fontSize:'.8rem'
                  }}
                >
                  Back to Sign Up
                </button>
              </div>
            </form>
          </div>
        ) : authModalTab === 'login' ? (
          <form onSubmit={onLogin} className="modal-form">
            <div className="field-group">
              <label className="field-label">Email</label>
              <div className="input-wrapper">
                <span className="input-prefix">@</span>
                <input type="email" required placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="input-wrapper">
                <span className="input-prefix">•••</span>
                <input type="password" required placeholder="••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions" style={{justifyContent:'stretch'}}>
              <button disabled={submitting} className="btn-primary" style={{width:'100%', justifyContent:'center'}}>{submitting? 'Signing in...' : 'Sign In'}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={onSignup} className="modal-form">
            <div className="field-group">
              <label className="field-label">Email</label>
              <div className="input-wrapper">
                <span className="input-prefix">@</span>
                <input type="email" required placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="input-wrapper">
                  <span className="input-prefix">•••</span>
                  <input type="password" required placeholder="••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-prefix">•••</span>
                  <input type="password" required placeholder="••••••" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{justifyContent:'stretch'}}>
              <button disabled={submitting} className="btn-primary" style={{width:'100%', justifyContent:'center'}}>{submitting? 'Creating...' : 'Create Account'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function mapCognitoError(err) {
  const code = err?.code || err?.name || '';
  const message = err?.message || '';
  
  // Cognito error codes
  if (code === 'NotAuthorizedException' || message.includes('Incorrect username or password')) {
    return 'Invalid email or password';
  }
  if (code === 'UserNotFoundException') {
    return 'No account found for this email';
  }
  if (code === 'UsernameExistsException') {
    return 'Email already in use';
  }
  if (code === 'InvalidPasswordException' || message.includes('Password did not conform')) {
    return 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
  }
  if (code === 'InvalidParameterException') {
    return 'Invalid email or password format';
  }
  if (code === 'CONFIRM_REQUIRED') {
    return 'Please check your email for the verification code';
  }
  if (code === 'UserNotConfirmedException') {
    return 'Please verify your email before signing in';
  }
  if (code === 'CodeMismatchException') {
    return 'Invalid verification code. Please check your email and try again.';
  }
  if (code === 'ExpiredCodeException') {
    return 'Verification code has expired. Please request a new code.';
  }
  if (message.includes('Invalid verification code')) {
    return 'Invalid verification code. Please check your email and try again.';
  }
  if (message.includes('Verification code has expired')) {
    return 'Verification code has expired. Please request a new code.';
  }
  if (message.includes('User not found')) {
    return 'No account found with this email address.';
  }
  if (message.includes('Too many requests')) {
    return 'Too many requests. Please wait before requesting another code.';
  }
  
  return message || 'Something went wrong';
}

function tabStyle(active){
  return {
    borderRadius:'.45rem',
    padding:'.55rem .75rem',
    border:'1px solid #1f2b3b',
    background: active ? '#0f1724' : 'transparent',
    color:'#d0d7e2',
    fontWeight: active ? 600 : 500,
    cursor:'pointer'
  };
}


