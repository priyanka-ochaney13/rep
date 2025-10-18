# 🚀 Quick Start - AWS Cognito Setup

## ⚡ 3-Step Setup

### Step 1: Update User Pool ID
Open `src/aws/amplifyConfig.js` and replace:
```javascript
userPoolId: 'us-east-1_XXXXXXXXX', // ← Replace this
```

Find your Pool ID:
- AWS Console → Cognito → User Pools → Your Pool
- Copy the **Pool Id** value

---

### Step 2: Install Dependencies (if not already done)
```bash
npm install
```

---

### Step 3: Run the App
```bash
npm run dev
```

---

## ✅ Test Authentication

1. **Go to**: http://localhost:5173
2. Click **"Get Started"**
3. Click **"Sign Up"** tab
4. Create account with:
   - Valid email
   - Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number
5. **Check your email** for verification code (if required)
6. Login with credentials

---

## 🔧 Optional: Enable Social Login

### For Google/GitHub authentication:

1. **AWS Cognito Console** → User Pool → App Integration
2. Configure identity providers
3. Add callback URLs:
   - Development: `http://localhost:5173/`
   - Production: Your S3/CloudFront URL

4. Update `src/aws/amplifyConfig.js`:
```javascript
loginWith: {
  oauth: {
    domain: 'your-domain.auth.us-east-1.amazoncognito.com',
    scopes: ['openid', 'email', 'profile'],
    redirectSignIn: ['http://localhost:5173/'],
    redirectSignOut: ['http://localhost:5173/'],
    responseType: 'code',
  },
},
```

---

## 📝 Current Configuration

✅ **Configured:**
- User Pool Client ID: `17evshm31c2bi6id73efqjggn4`
- Region: `us-east-1`
- Auth Flow: `USER_SRP_AUTH`
- Email-based authentication

⚠️ **Needs Configuration:**
- User Pool ID (see Step 1)
- OAuth providers (optional)

---

## 🐛 Common Issues

### "Cannot read userPoolId"
→ You forgot to update the User Pool ID in `amplifyConfig.js`

### "User is not authenticated"
→ User needs to verify email after signup

### Social login not working
→ Configure OAuth providers in Cognito first

---

## 📚 Full Documentation

For detailed migration info, see:
- [`COGNITO_MIGRATION.md`](./COGNITO_MIGRATION.md) - Complete migration guide
- [`MIGRATION_SUMMARY.md`](./MIGRATION_SUMMARY.md) - Technical changes summary

---

**Ready to code! 🎉**
