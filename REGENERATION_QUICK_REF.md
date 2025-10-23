# 🔄 Regeneration Feature - Quick Reference Card

## 🎯 User Actions

| Action | Button | What It Does |
|--------|--------|-------------|
| **Check for Updates** | 🔍 | Compares your repo with GitHub's latest commit |
| **Regenerate Docs** | 🔄 | Fetches latest code and updates documentation |
| **View Docs** | View Docs | Opens the documentation page |
| **Delete** | Delete | Removes documentation from your account |

---

## 📊 Card States

### ✅ **Up to Date**
```
No badge shown
Buttons: [View Docs] [🔍] [Delete]
```

### 🔄 **Updates Available**
```
Yellow badge: "Updates Available - X commits since last sync"
Buttons: [View Docs] [🔄] [Delete]
```

### ⏳ **Regenerating**
```
Status: Processing
Spinner overlay shown
Buttons disabled
```

---

## 🔑 Key Concepts

### **Commit SHA**
- Unique identifier for each commit
- Used to detect if repo changed
- Format: `a1b2c3d4e5f6...` (40 characters)

### **Record ID**
- Format: `DOC#20251023143022#abc123`
- **Never changes** even after regeneration
- Same ID = Same URL in your app

### **Last Synced At**
- Timestamp of last documentation generation
- Updates each time you regenerate
- Shown in "Updated" field on card

---

## 🗄️ DynamoDB Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `lastCommitSha` | Track last processed commit | `"a1b2c3d4..."` |
| `lastSyncedAt` | When docs were last updated | `"2025-10-23T14:30:22Z"` |
| `hasUpdates` | Flag for available updates | `true` / `false` |
| `branch` | Which branch is tracked | `"main"` |

---

## 🌐 API Endpoints

### Check Updates
```http
POST /user/documentation/{recordId}/check-updates
Authorization: Bearer {JWT}
```

### Regenerate
```http
POST /user/documentation/{recordId}/regenerate
Authorization: Bearer {JWT}
```

---

## 💡 Best Practices

### ✅ **DO:**
- Check for updates before important presentations
- Regenerate after major feature merges
- Set `GITHUB_TOKEN` for higher rate limits
- Review changes before regenerating

### ❌ **DON'T:**
- Check updates too frequently (respect rate limits)
- Regenerate while another operation is in progress
- Delete and recreate (just regenerate!)
- Worry about duplicates (system prevents them)

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Check Updates" button not showing | Repo must be in "Ready" status |
| Badge not appearing after check | No new commits detected |
| Regeneration fails | Check GitHub API rate limits |
| Getting rate limit errors | Add `GITHUB_TOKEN` environment variable |
| Badge shows but regenerate fails | Check repo URL and branch name |

---

## 📈 Rate Limits

| Type | Limit | How to Increase |
|------|-------|-----------------|
| No token | 60/hour | Add `GITHUB_TOKEN` |
| With token | 5,000/hour | Use personal access token |

### Set Token:
```bash
# Windows PowerShell
$env:GITHUB_TOKEN = "ghp_your_token"

# Linux/Mac
export GITHUB_TOKEN="ghp_your_token"
```

---

## 🎬 Typical Workflow

```
1. Generate docs initially
        ↓
2. Make commits to your repo
        ↓
3. Click 🔍 "Check Updates"
        ↓
4. Yellow badge appears
        ↓
5. Click 🔄 "Regenerate"
        ↓
6. Confirm in modal
        ↓
7. Wait for processing
        ↓
8. ✨ Docs updated!
```

---

## 🔒 Security Notes

- All operations require authentication (JWT)
- Users can only regenerate their own repos
- No repository data stored on disk
- Temporary files auto-cleaned after generation

---

## 📝 Quick Commands

### Backend
```bash
# Start server
cd backend
python -m uvicorn main:app --reload
```

### Frontend
```bash
# Start dev server
cd frontend
npm run dev
```

### Test Check Updates
```bash
# Using curl (replace with your values)
curl -X POST "http://localhost:8000/user/documentation/DOC%23...../check-updates" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎯 Performance Tips

### For Faster Regeneration:
1. Use smaller repositories
2. Set `GITHUB_TOKEN` for faster API calls
3. Specify exact branch (avoid fallback logic)
4. Ensure good internet connection

### For Better UX:
1. Check updates before regenerating
2. Review commit count in modal
3. Don't navigate away during processing
4. Wait for success confirmation

---

## 🎊 Success Indicators

| What You See | Meaning |
|--------------|---------|
| ✅ Green "Ready" badge | Documentation up to date |
| 🔄 Yellow update badge | New commits available |
| ⏳ Processing status | Currently regenerating |
| Success message | Regeneration completed |

---

## 📞 Need Help?

1. Check console logs (F12 in browser)
2. Review backend logs (terminal output)
3. Verify JWT token is valid
4. Confirm GitHub repo is accessible
5. Check DynamoDB records exist

---

**Made with ❤️ for seamless documentation updates!**

Keep your docs in sync with your code effortlessly! 🚀
