# 🔍 Cross-Browser Debugging Guide

## **Quick Diagnosis**

### **Step 1: Get Your User ID**

The easiest way is to look at the Network tab:

1. Open browser console (F12)
2. Go to **Network** tab
3. Go to Repositories page
4. Look for request to `/user/profile` or `/protected`
5. Click on it → Response tab
6. Find `user_id` or `sub` field - that's your Cognito user ID!

**Example:**
```json
{
  "user": {
    "sub": "543864f8-f001-7002-eacc-c25b...",  ← This is your user_id!
    "username": "priyanka.ochaney@gmail.com",
    ...
  }
}
```

Or run this simple command in the console:
```javascript
// Check if you're authenticated
fetch('http://localhost:8000/protected', {
  headers: {
    'Authorization': 'Bearer ' + (await (await import('aws-amplify/auth')).fetchAuthSession()).tokens.accessToken.toString()
  }
}).then(r => r.json()).then(d => console.log('Your user_id:', d.user.sub))
```

---

### **Step 2: Check What's in DynamoDB**

```powershell
cd backend
python test_dynamodb_fetch.py
# Enter your user_id when prompted
```

**Expected Output:**
```
✅ Found 3 documentation records

1. Record ID: DOC#20251022120000#abc123
   Repo URL: https://github.com/user/repo
   Created: 2025-10-22T12:00:00Z
   Has README: True
   Summary Count: 5
```

**If you see "No records found":**
- ❌ Data is NOT in DynamoDB
- The backend didn't save it
- You need to generate docs AFTER the integration

---

### **Step 3: Browser Console Check**

Open **Browser 1** (where you generated docs):
1. F12 → Console
2. Go to Repositories page
3. Look for these messages:

**✅ Working:**
```
📡 Fetching user history from DynamoDB (limit: 100)...
Making authenticated request to /user/history
API Success for /user/history: {history: [...]}
✅ DynamoDB returned 3 records
🔄 Fetching repositories from DynamoDB...
✅ Fetched 3 records from DynamoDB
✅ Loaded 3 repositories
```

**❌ Not Working:**
```
❌ Failed to fetch history from DynamoDB: Error: Unauthorized
   This could mean:
   1. AWS Learners Lab session expired
   2. Not authenticated (no valid JWT token)
```

---

### **Step 4: Second Browser Test**

Open **Browser 2** (fresh browser):
1. Go to http://localhost:5173
2. **Login with THE EXACT SAME EMAIL** as Browser 1
3. Check console for same messages
4. Should see same repos

**If different repos:**
- ❌ You're logged in with different accounts
- Each Cognito user has their own data
- Check the email in the header menu

---

## **Common Issues & Fixes**

### **Issue 1: "No records found in DynamoDB"**

**Cause:** You generated docs BEFORE the DynamoDB integration.

**Fix:**
1. Delete all repos from Repositories page
2. Connect a new repository
3. Wait for "Ready" status
4. Check `test_dynamodb_fetch.py` again
5. Should now see records

---

### **Issue 2: "AWS Learners Lab session expired"**

**Symptoms:**
```
❌ Failed to fetch history from DynamoDB: 
   The security token included in the request is expired
```

**Fix:**
1. Go to AWS Learners Lab
2. Check if session is **green** (active)
3. If red/expired:
   - Start Lab
   - Go to AWS Details
   - Copy new credentials
   - Update `backend/.env`
   - Restart backend

---

### **Issue 3: "Different emails in different browsers"**

**Symptoms:**
- Browser 1 shows repos
- Browser 2 shows empty

**Check:**
1. Browser 1: Look at header → user menu → email
2. Browser 2: Look at header → user menu → email
3. **Must be identical!**

**Fix:**
- Logout from Browser 2
- Login with same email as Browser 1

---

### **Issue 4: Backend not saving to DynamoDB**

**Test:**
```powershell
cd backend
# Check if this variable is in .env:
type .env | findstr DYNAMODB_TABLE_NAME
```

**Should show:**
```
DYNAMODB_TABLE_NAME=RepoDocs-Users
```

**If missing, add it:**
```env
DYNAMODB_TABLE_NAME=RepoDocs-Users
AWS_REGION=us-east-1
```

Then restart backend.

---

## **The .ClonedRepos Folder** 📂

### **What is it?**

Temporary storage for cloned GitHub repositories:
```
.ClonedRepos/
├── 1120241/    ← Repo clone 1
├── 1125069/    ← Repo clone 2
└── 134856/     ← Repo clone 3
```

### **Why does it exist?**

1. Backend needs to **analyze actual code files**
2. Can't just download - needs git structure
3. Each folder is a full git clone
4. Numbers are process IDs or timestamps

### **Can I delete it?**

✅ **Yes, safe to delete when:**
- Not currently generating docs
- Want to free up space
- Cleaning up old clones

⚠️ **Will be recreated:**
- Next time you generate docs
- Backend will clone repos again

### **How to prevent it from being committed to git:**

Add to `.gitignore`:
```
.ClonedRepos/
```

### **How much space does it use?**

```powershell
# Check size
Get-ChildItem .ClonedRepos -Recurse | Measure-Object -Property Length -Sum
```

Average: **50-200 MB per repository**

### **Clean it up automatically:**

Add this to `backend/main.py` after doc generation:
```python
import shutil

# After generating docs
shutil.rmtree('.ClonedRepos/{repo_folder}')  # Delete specific clone
```

---

## **Step-by-Step Cross-Browser Test**

### **Browser 1 (Chrome):**

1. ✅ Start AWS Learners Lab (green)
2. ✅ Start backend: `cd backend; python -m uvicorn main:app --reload`
3. ✅ Start frontend: `cd frontend; npm run dev`
4. ✅ Open http://localhost:5173
5. ✅ Login with: `test@example.com` (example)
6. ✅ Connect a repository
7. ✅ Wait for "Ready" status
8. ✅ Open Console (F12)
9. ✅ Note your email and user_id

### **Browser 2 (Firefox):**

1. ✅ Open http://localhost:5173
2. ✅ Login with: `test@example.com` (**SAME EMAIL!**)
3. ✅ Open Console (F12)
4. ✅ Check console messages
5. ✅ Should see same repos!

### **If it doesn't work:**

**Run this in Browser 2 console:**
```javascript
// Check auth
fetch('http://localhost:8000/user/profile', {
  credentials: 'include',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
}).then(r => r.json()).then(console.log)
```

**Should show:**
```json
{
  "username": "test@example.com",
  "user_id": "abc-123-def-456",
  ...
}
```

---

## **Quick Fixes**

### **Clear Everything and Start Fresh:**

```powershell
# Stop servers (Ctrl+C)

# Clear .ClonedRepos
Remove-Item -Recurse -Force .ClonedRepos

# Clear browser data
# Chrome: Ctrl+Shift+Del → Clear all

# Restart
cd backend
python -m uvicorn main:app --reload

# New terminal
cd frontend
npm run dev

# Generate fresh docs
```

---

## **Verification Checklist**

Before testing cross-browser:

- [ ] AWS Learners Lab session is **green** (active)
- [ ] Backend running (check http://localhost:8000)
- [ ] Frontend running (check http://localhost:5173)
- [ ] DynamoDB table exists (`RepoDocs-Users`)
- [ ] At least 1 doc generated AFTER integration
- [ ] Can see repos in Browser 1
- [ ] Know your login email
- [ ] Know your user_id (sub)

Then test Browser 2 with SAME login!

---

## **Expected Console Output (Working)**

```
🔄 Session tokens: {hasAccessToken: true, hasIdToken: true}
📡 Token retrieved: eyJraWQiOiJ...
🔄 Making authenticated request to /user/history
📡 Fetching user history from DynamoDB (limit: 100)...
✅ API Success for /user/history: {history: Array(3)}
✅ DynamoDB returned 3 records
🔄 Fetching repositories from DynamoDB...
✅ Fetched 3 records from DynamoDB
✅ Loaded 3 repositories
```

Each repo should show:
- ✅ Name, owner
- ✅ "Ready" status
- ✅ Can click "View Docs"
- ✅ Same in both browsers!

---

## **Still Not Working?**

Share these details:

1. **Browser 1 console output** (full logs)
2. **Browser 2 console output** (full logs)
3. **Backend console output** when accessing `/user/history`
4. **Result of `test_dynamodb_fetch.py`**
5. **Your user_id (sub)** from both browsers
6. **AWS Learners Lab status** (green/red?)

I'll help debug from there! 🚀
