# 🔄 Documentation Regeneration Feature

## 📋 Overview

The **Regeneration Feature** allows users to detect changes in their GitHub repositories and automatically update their documentation without creating duplicate records.

---

## ✨ Key Features

### 1. **Change Detection**
- Detects new commits in GitHub repositories
- Compares current commit SHA with last synced SHA
- Shows number of commits behind
- Non-intrusive badge system

### 2. **Smart Updates**
- Updates existing documentation record (no duplicates)
- Preserves record ID across regenerations
- Tracks version history
- Maintains commit metadata

### 3. **User-Friendly UI**
- "🔍 Check Updates" button on each repo card
- "Updates Available" badge when changes detected
- "🔄 Regenerate" button with confirmation dialog
- Real-time status indicators

---

## 🏗️ Architecture

### **Database Schema (DynamoDB)**

Each documentation record now includes:

```javascript
{
  userId: "user-cognito-sub",
  recordId: "DOC#20251023143022#abc123",
  recordType: "documentation",
  repoUrl: "https://github.com/owner/repo",
  readmeContent: "...",
  summaries: {...},
  metadata: {...},
  
  // NEW FIELDS FOR REGENERATION
  lastCommitSha: "a1b2c3d4...",           // Last processed commit
  lastSyncedAt: "2025-10-23T14:30:22Z",  // Last regeneration time
  branch: "main",                         // Tracked branch
  hasUpdates: false,                      // Flag for available updates
  
  createdAt: "2025-10-20T10:15:00Z",     // Initial creation
  updatedAt: "2025-10-23T14:30:22Z"      // Last update
}
```

---

## 🔄 Workflow

### **Initial Documentation Generation**

```
User submits repo URL
     ↓
Generate documentation
     ↓
Fetch latest commit SHA from GitHub API
     ↓
Save to DynamoDB with commit info
     ↓
Display in UI
```

### **Check for Updates**

```
User clicks "Check Updates" (🔍)
     ↓
GET /user/documentation/{id}/check-updates
     ↓
Compare lastCommitSha with GitHub's latest
     ↓
Calculate commits behind
     ↓
Mark record as hasUpdates = true
     ↓
Show "Updates Available" badge
```

### **Regenerate Documentation**

```
User clicks "Regenerate" (🔄)
     ↓
Confirm action in modal
     ↓
POST /user/documentation/{id}/regenerate
     ↓
Fetch latest code from GitHub
     ↓
Regenerate README, diagrams, analysis
     ↓
Update existing record (same ID!)
     ↓
Update lastCommitSha, lastSyncedAt
     ↓
Reset hasUpdates = false
     ↓
Refresh UI
```

---

## 🎯 API Endpoints

### **1. Check for Updates**

```http
POST /user/documentation/{record_id}/check-updates
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "recordId": "DOC#20251023143022#abc123",
  "repoUrl": "https://github.com/owner/repo",
  "has_updates": true,
  "latest_sha": "xyz789...",
  "last_sha": "abc123...",
  "commits_behind": 5,
  "message": "5 new commits"
}
```

### **2. Regenerate Documentation**

```http
POST /user/documentation/{record_id}/regenerate
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "message": "Documentation regenerated successfully",
  "recordId": "DOC#20251023143022#abc123",
  "readme": "...",
  "summaries": {...},
  "visuals": {...},
  "project_analysis": {...},
  "commit_info": {
    "sha": "xyz789...",
    "message": "Added new feature",
    "author": "John Doe",
    "date": "2025-10-23T14:00:00Z"
  }
}
```

---

## 🎨 UI Components

### **Repository Card States**

#### **1. Normal State (Up to Date)**
```
┌─────────────────────────────┐
│ 📦 my-project               │
│ owner                       │
│                             │
│ Status: ✅ Ready            │
│ Updated Oct 23, 2025        │
│                             │
│ [View Docs] [🔍] [Delete]  │
└─────────────────────────────┘
```

#### **2. Updates Available**
```
┌─────────────────────────────┐
│ 📦 my-project               │
│ owner                       │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🔄 Updates Available    │ │
│ │ 5 commits since sync    │ │
│ └─────────────────────────┘ │
│                             │
│ Status: ✅ Ready            │
│                             │
│ [View Docs] [🔄] [Delete]  │
└─────────────────────────────┘
```

#### **3. Regenerating**
```
┌─────────────────────────────┐
│ 📦 my-project               │
│ owner                       │
│                             │
│ Status: ⏳ Processing       │
│                             │
│ [  Loading...  ]            │
│                             │
│ [Spinner Overlay]           │
└─────────────────────────────┘
```

---

## 💡 Usage Examples

### **Frontend - Check for Updates**

```javascript
import { checkRepoUpdates } from '../api/apiClient';

// Check if repository has updates
const updateInfo = await checkRepoUpdates(repoId);

if (updateInfo.has_updates) {
  console.log(`${updateInfo.commits_behind} new commits available!`);
}
```

### **Frontend - Regenerate Documentation**

```javascript
import { regenerateDocumentation } from '../api/apiClient';

// Regenerate documentation
const result = await regenerateDocumentation(repoId);

console.log('New README:', result.readme);
console.log('Latest commit:', result.commit_info.message);
```

### **Backend - Check Updates Manually**

```python
from app.utils.github_changes import check_repo_updates

# Check for updates
update_info = check_repo_updates(
    repo_url="https://github.com/owner/repo",
    last_commit_sha="abc123...",
    branch="main"
)

if update_info['has_updates']:
    print(f"Repository has {update_info['commits_behind']} new commits")
```

---

## 🔐 Security Considerations

### **Authentication**
- All endpoints require valid JWT token
- User can only regenerate their own repositories
- DynamoDB access controlled by userId

### **Rate Limiting**
- GitHub API: 60 requests/hour (unauthenticated)
- With `GITHUB_TOKEN`: 5,000 requests/hour
- Regeneration throttled to prevent abuse

### **Data Privacy**
- No repository data stored on disk
- Temporary files auto-cleaned
- Only documentation stored in DynamoDB

---

## 📊 Database Operations

### **Update vs Create**

The system intelligently handles both scenarios:

```python
# NEW REPOSITORY
save_documentation_record(
    user_id="user123",
    repo_url="https://github.com/owner/repo",
    readme_content="...",
    summaries={...},
    metadata={...},
    record_id=None  # Creates new record
)

# UPDATE EXISTING
save_documentation_record(
    user_id="user123",
    repo_url="https://github.com/owner/repo",
    readme_content="...",  # Updated content
    summaries={...},       # Updated summaries
    metadata={...},        # Updated metadata
    record_id="DOC#..."    # Updates existing record
)
```

---

## 🎯 Benefits

### **For Users**
- ✅ Always up-to-date documentation
- ✅ No duplicate records
- ✅ Clear change indicators
- ✅ One-click updates
- ✅ History preservation

### **For System**
- ✅ Efficient DynamoDB usage
- ✅ Reduced storage costs
- ✅ Clean data structure
- ✅ Audit trail maintained
- ✅ Scalable architecture

---

## 🚀 Future Enhancements

### **Planned Features**

1. **Auto-Regeneration**
   - Scheduled checks (daily/weekly)
   - Webhook integration for real-time updates
   - Email notifications

2. **Version History**
   - Compare different documentation versions
   - Rollback to previous version
   - Diff viewer

3. **Selective Regeneration**
   - Regenerate only README
   - Regenerate only diagrams
   - Regenerate specific files

4. **Change Notifications**
   - In-app notifications
   - Email alerts
   - Slack/Discord integration

5. **Batch Operations**
   - Check all repos for updates
   - Bulk regeneration
   - Priority queue

---

## 🧪 Testing

### **Test Scenario 1: First-Time Documentation**
```bash
# User submits new repository
POST /generate
- Creates new record with commit SHA
- Status: Ready
- hasUpdates: false
```

### **Test Scenario 2: Check Updates (No Changes)**
```bash
# User checks for updates
POST /user/documentation/{id}/check-updates
- Compares SHAs
- Result: has_updates = false
- Badge: Not shown
```

### **Test Scenario 3: Check Updates (Changes Found)**
```bash
# Repository has new commits
POST /user/documentation/{id}/check-updates
- Detects 3 new commits
- Result: has_updates = true, commits_behind = 3
- Badge: "Updates Available - 3 commits"
```

### **Test Scenario 4: Regenerate Documentation**
```bash
# User regenerates documentation
POST /user/documentation/{id}/regenerate
- Fetches latest code
- Generates new documentation
- Updates record (same ID)
- Resets hasUpdates to false
```

---

## 📝 Code Examples

### **Backend - Get Latest Commit**

```python
from app.utils.github_changes import get_latest_commit_info

# Get commit information
commit_info = get_latest_commit_info(
    repo_url="https://github.com/owner/repo",
    branch="main"
)

print(f"Latest commit: {commit_info['sha']}")
print(f"Message: {commit_info['message']}")
print(f"Author: {commit_info['author']}")
print(f"Date: {commit_info['date']}")
```

### **Frontend - Update Badge**

```jsx
{repo.hasUpdates && (
  <div className="update-badge">
    <span>🔄</span>
    <div>
      <div>Updates Available</div>
      <div>{repo.commitsBehind} commits since last sync</div>
    </div>
  </div>
)}
```

---

## 🎉 Summary

The Regeneration Feature provides a complete solution for keeping documentation synchronized with repository changes:

- **Smart**: Detects changes automatically
- **Efficient**: Updates in-place without duplicates
- **User-Friendly**: Clear indicators and simple actions
- **Reliable**: GitHub API integration with fallbacks
- **Scalable**: DynamoDB-backed with proper indexing

This feature transforms your documentation system from **static snapshots** to **living documentation** that evolves with your code! 🚀

---

## 🔗 Related Files

- **Backend**
  - `backend/app/utils/github_changes.py` - Change detection logic
  - `backend/app/utils/dynamodb.py` - Database operations
  - `backend/main.py` - API endpoints

- **Frontend**
  - `frontend/src/api/apiClient.js` - API client
  - `frontend/src/store/repoStore.jsx` - State management
  - `frontend/src/pages/Repositories.jsx` - UI components

---

**Questions or issues?** Check the implementation code or reach out! 💬
