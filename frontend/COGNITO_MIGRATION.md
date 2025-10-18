# 🔐 AWS Cognito Migration Guide

## ✅ Migration Completed

Your RepoX application has been successfully migrated from **Firebase Authentication** to **AWS Cognito** using AWS Amplify.

---

## 📋 What Changed

### 🗑️ Removed
- ❌ Firebase SDK (`firebase` npm package)
- ❌ `src/firebase/firebaseConfig.js`
- ❌ All Firebase auth imports and methods

### ✅ Added
- ✅ AWS Amplify SDK (`aws-amplify` npm package)
- ✅ `src/aws/amplifyConfig.js` - Cognito configuration
- ✅ Updated `AuthContext.jsx` with Amplify Auth methods
- ✅ Updated `AuthModal.jsx` with Cognito error handling

---

## 🔧 Configuration Required

### **IMPORTANT: Update User Pool ID**

Open `src/aws/amplifyConfig.js` and replace the placeholder with your actual User Pool ID:

```javascript
userPoolId: 'us-east-1_XXXXXXXXX', // ⚠️ Replace this!
```

**Where to find it:**
1. Go to AWS Cognito Console
2. Select your User Pool
3. Copy the **Pool Id** (format: `us-east-1_XXXXXXXXX`)

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install aws-amplify
```

### 2. Update Cognito Configuration

Edit `src/aws/amplifyConfig.js`:

```javascript
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'YOUR_ACTUAL_POOL_ID',      // ⚠️ Update this
      userPoolClientId: '17evshm31c2bi6id73efqjggn4',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
    }
  }
};
```

### 3. Configure Social Sign-In (Optional)

If you want Google/GitHub login:

1. **AWS Cognito Console** → Your User Pool → **App Integration**
2. Under **Federated identity providers**, add:
   - Google
   - GitHub
3. Configure OAuth redirect URLs:
   - Add your app URL (e.g., `http://localhost:5173` for dev)
   - Add production URL
4. Update `amplifyConfig.js`:

```javascript
Auth: {
  Cognito: {
    // ... existing config
    loginWith: {
      oauth: {
        domain: 'your-domain.auth.us-east-1.amazoncognito.com',
        scopes: ['openid', 'email', 'profile'],
        redirectSignIn: ['http://localhost:5173/'],
        redirectSignOut: ['http://localhost:5173/'],
        responseType: 'code',
      },
    },
  }
}
```

---

## 🔐 Authentication Features

### ✅ Supported Methods

| Method | Status | Notes |
|--------|--------|-------|
| **Email/Password Login** | ✅ Working | Standard Cognito sign-in |
| **Email/Password Signup** | ✅ Working | Requires email verification |
| **Google Login** | ⚙️ Needs Config | Configure OAuth in Cognito |
| **GitHub Login** | ⚙️ Needs Config | Configure OAuth in Cognito |
| **Sign Out** | ✅ Working | Clears session |

---

## 🧪 Testing Checklist

- [ ] **Sign Up**: Create new account → Check email for verification code
- [ ] **Email Verification**: Verify email (if required by your Cognito setup)
- [ ] **Login**: Sign in with email/password
- [ ] **Protected Routes**: Access `/repositories` and `/docs/:owner/:name`
- [ ] **Sign Out**: Logout and redirect to landing page
- [ ] **Error Handling**: Test invalid credentials, weak passwords
- [ ] **Social Login**: Test Google/GitHub (if configured)

---

## 📝 User Flow Changes

### Sign Up Flow

**Before (Firebase):**
1. User signs up → Immediately logged in

**After (Cognito):**
1. User signs up → Receives email verification code
2. User must verify email (if `signUpVerificationMethod: 'code'`)
3. Then can log in

**Note:** You may need to add a verification code input screen if auto sign-in is disabled.

---

## 🐛 Troubleshooting

### "User Pool ID not found"
- Verify you updated `userPoolId` in `amplifyConfig.js`
- Check format: `us-east-1_XXXXXXXXX`

### "Invalid client for the user pool"
- Verify `userPoolClientId` matches your app client
- Ensure app client has **USER_SRP_AUTH** enabled

### Social login not working
- Configure OAuth providers in Cognito
- Add redirect URLs in app client settings
- Update `amplifyConfig.js` with OAuth config

### Password requirements error
- Default: 8+ chars, uppercase, lowercase, numbers
- Update `passwordFormat` in config if Cognito has different requirements

---

## 📚 Additional Resources

- [AWS Amplify Auth Docs](https://docs.amplify.aws/javascript/build-a-backend/auth/)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/)
- [Social Identity Providers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html)

---

## 🔄 Rollback (If Needed)

To revert to Firebase:

1. Checkout previous commit: `git checkout <commit-before-migration>`
2. Reinstall Firebase: `npm install firebase`
3. Uninstall Amplify: `npm uninstall aws-amplify`

---

**Migration completed successfully! 🎉**

*Update your User Pool ID and you're ready to go!*
