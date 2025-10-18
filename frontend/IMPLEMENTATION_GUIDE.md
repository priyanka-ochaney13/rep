# 🔄 AWS Cognito Implementation - Dual Approach

## 📋 Overview

Your RepoX application now has **TWO** AWS Cognito authentication implementations:

### 1️⃣ **Integrated Approach** (Currently Active)
- Uses existing AuthContext and AuthModal components
- Seamlessly works with your app's routing and UI
- Located in: `src/context/AuthContext.jsx`, `src/components/AuthModal.jsx`

### 2️⃣ **Standalone Components** (Alternative)
- New dedicated auth components for testing/reference
- Simple, isolated authentication flow
- Located in: `src/components/Signup.jsx`, `Signin.jsx`, etc.

---

## 🎯 Current Active Implementation

### Configuration Files

**`src/aws-config.js`** - Cognito credentials:
```javascript
{
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: 'us-east-1_<replace_with_your_userpool_id>',
  aws_user_pools_web_client_id: '17evshm31c2bi6id73efqjggn4'
}
```

**`src/main.jsx`** - Amplify initialization:
```javascript
Amplify.configure({
  Auth: {
    region: awsConfig.aws_cognito_region,
    userPoolId: awsConfig.aws_user_pools_id,
    userPoolWebClientId: awsConfig.aws_user_pools_web_client_id,
    authenticationFlowType: 'USER_SRP_AUTH'
  }
})
```

### Active Components (Integrated with Your App)

#### **AuthContext** (`src/context/AuthContext.jsx`)
- Manages global authentication state
- Uses `Auth` from `aws-amplify`
- Methods:
  - `loginWithEmail(email, password)` - Sign in
  - `signupWithEmail(email, password)` - Sign up
  - `loginWithGoogle()` - Google OAuth
  - `loginWithGithub()` - GitHub OAuth
  - `logout()` - Sign out
  - `checkUser()` - Get current user

#### **AuthModal** (`src/components/AuthModal.jsx`)
- Beautiful modal UI for login/signup
- Integrated with your app's design
- Error handling with user-friendly messages
- Tabs for Login and Signup

---

## 🆕 New Standalone Components

These are **additional** components you can use for testing or as reference:

### **authService.js** - Centralized Auth Functions
```javascript
import { Auth } from 'aws-amplify'

// Available functions:
- signUp({ username, password, email })
- confirmSignUp(username, code)
- signIn(username, password)
- signOut()
- getCurrentUser()
```

### **Signup.jsx** - Simple signup form
```jsx
<Signup onSignedUp={(email) => ...} />
```

### **ConfirmSignup.jsx** - Email verification
```jsx
<ConfirmSignup username={email} onConfirmed={() => ...} />
```

### **Signin.jsx** - Simple login form
```jsx
<Signin onSignedIn={(user) => ...} />
```

### **Profile.jsx** - User profile display
```jsx
<Profile /> // Shows current user, sign out button
```

---

## 🚀 How to Use

### Option A: Use Your Existing App (Recommended)

**Your app already works!** Just update the User Pool ID:

1. Open `src/aws-config.js`
2. Replace `us-east-1_<replace_with_your_userpool_id>` with your actual Pool ID
3. Run `npm run dev`
4. Click "Get Started" → Opens AuthModal
5. Sign up/Login normally

**Authentication flow:**
```
Landing Page → Click "Get Started" → AuthModal opens → Login/Signup
→ Redirect to /repositories → Protected routes work
```

---

### Option B: Use Standalone Components (Testing)

If you want to test the standalone components, create a test route:

**Create `src/pages/AuthTest.jsx`:**
```jsx
import { useState } from 'react'
import Signup from '../components/Signup'
import ConfirmSignup from '../components/ConfirmSignup'
import Signin from '../components/Signin'
import Profile from '../components/Profile'

export default function AuthTest() {
  const [stage, setStage] = useState('signup')
  const [username, setUsername] = useState('')

  if (stage === 'signup') {
    return (
      <div>
        <h1>Sign Up</h1>
        <Signup onSignedUp={(email) => {
          setUsername(email)
          setStage('confirm')
        }} />
        <button onClick={() => setStage('signin')}>Already have an account?</button>
      </div>
    )
  }

  if (stage === 'confirm') {
    return (
      <div>
        <h1>Confirm Email</h1>
        <ConfirmSignup 
          username={username} 
          onConfirmed={() => setStage('signin')} 
        />
      </div>
    )
  }

  if (stage === 'signin') {
    return (
      <div>
        <h1>Sign In</h1>
        <Signin onSignedIn={() => setStage('profile')} />
        <button onClick={() => setStage('signup')}>Create an account</button>
      </div>
    )
  }

  if (stage === 'profile') {
    return (
      <div>
        <h1>Profile</h1>
        <Profile />
      </div>
    )
  }

  return null
}
```

**Add route in `src/main.jsx`:**
```jsx
import AuthTest from './pages/AuthTest.jsx'

// Add to Routes:
<Route path="/auth-test" element={<AuthTest />} />
```

Then visit: `http://localhost:5173/auth-test`

---

## 🔧 Configuration Steps

### ⚠️ REQUIRED: Update User Pool ID

**Step 1:** Get your User Pool ID from AWS Console
- Go to: AWS Cognito → User Pools → Your Pool
- Copy the **Pool Id** (format: `us-east-1_XXXXXXXXX`)

**Step 2:** Update `src/aws-config.js`
```javascript
aws_user_pools_id: 'us-east-1_abc123XYZ', // Your actual Pool ID
```

**Step 3:** Verify App Client Settings
- In AWS Cognito → App Integration → App clients
- Ensure your client (`17evshm31c2bi6id73efqjggn4`) has:
  - ✅ Auth flow: `ALLOW_USER_SRP_AUTH` enabled
  - ✅ No client secret (for SPA)

---

## 📊 Comparison: Integrated vs Standalone

| Feature | Integrated (Active) | Standalone Components |
|---------|-------------------|----------------------|
| **UI Style** | Beautiful modal with your design | Simple HTML forms |
| **Integration** | Works with routing & state | Isolated, manual integration |
| **Error Handling** | User-friendly messages | Alert boxes |
| **Email Verification** | Throws error with message | Separate ConfirmSignup component |
| **Social Login** | Google + GitHub buttons | Not included |
| **Best For** | Production use | Testing/learning |

---

## 🧪 Testing Both Implementations

### Test Integrated (Main App):
1. `npm run dev`
2. Go to `http://localhost:5173`
3. Click "Get Started"
4. Use AuthModal to login/signup

### Test Standalone:
1. Create `AuthTest.jsx` (see Option B above)
2. Add route to main.jsx
3. Go to `http://localhost:5173/auth-test`
4. Test signup → confirm → login flow

---

## 🔑 Auth API Quick Reference

### Using AuthContext (Integrated)
```jsx
import { useAuth } from './context/AuthContext'

function MyComponent() {
  const { user, loginWithEmail, logout } = useAuth()
  
  // Login
  await loginWithEmail('user@example.com', 'Password123')
  
  // Check user
  if (user) {
    console.log(user.email)
  }
  
  // Logout
  await logout()
}
```

### Using authService (Standalone)
```jsx
import { signIn, signOut, getCurrentUser } from './authService'

// Login
await signIn('user@example.com', 'Password123')

// Get user
const user = await getCurrentUser()

// Logout
await signOut()
```

---

## 🐛 Common Issues

### "Cannot read properties of undefined (reading 'Auth')"
→ Make sure Amplify.configure() runs before any Auth calls
→ Check that aws-config.js has valid values

### "User Pool does not exist"
→ Update User Pool ID in aws-config.js
→ Verify region is correct (us-east-1)

### "Invalid password format"
→ Must be 8+ chars with uppercase, lowercase, and numbers
→ Check Cognito password policy settings

### Social login not working
→ Configure OAuth providers in Cognito console
→ Add allowed callback URLs
→ Ensure app client supports OAuth

---

## 📁 File Structure

```
src/
├── aws-config.js                    ← NEW: Cognito config
├── authService.js                   ← NEW: Auth utility functions
├── main.jsx                         ← UPDATED: Amplify init
├── components/
│   ├── AuthModal.jsx               ← UPDATED: Uses Auth API
│   ├── Signup.jsx                  ← NEW: Standalone signup
│   ├── ConfirmSignup.jsx           ← NEW: Email verification
│   ├── Signin.jsx                  ← NEW: Standalone login
│   └── Profile.jsx                 ← NEW: User profile
├── context/
│   └── AuthContext.jsx             ← UPDATED: Uses Auth API
└── aws/
    └── amplifyConfig.js            ← OLD: Can remove if using aws-config.js
```

---

## ✅ Next Steps

1. **Update User Pool ID** in `aws-config.js` ⚠️ **Required**
2. Test login with your existing AuthModal
3. (Optional) Create `/auth-test` route to test standalone components
4. (Optional) Remove `src/aws/amplifyConfig.js` if not needed

---

## 🎓 Key Differences: Amplify v5 vs v6

Your app now uses **Amplify v5 style** (Auth from 'aws-amplify'):

**v5 (Current):**
```javascript
import { Auth } from 'aws-amplify'
await Auth.signIn(username, password)
```

**v6 (Previous):**
```javascript
import { signIn } from 'aws-amplify/auth'
await signIn({ username, password })
```

Both work, but v5 is more widely documented.

---

**Implementation Complete! 🎉**

You now have flexible authentication with both integrated and standalone options.
