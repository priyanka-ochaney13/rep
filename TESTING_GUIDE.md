# 🧪 Testing Guide - Branch Selection Feature

## Quick Test Steps

### Test 1: Default Branch (Main) ✅
1. Click "Connect Repository"
2. Enter URL: `https://github.com/octocat/Hello-World`
3. Leave Branch as: `main` (or `master`)
4. Click "Connect Repository"
5. **Expected:** Documentation generates successfully

---

### Test 2: Custom Branch ✅
1. Click "Connect Repository"
2. Enter URL: `https://github.com/your-username/your-repo`
3. Enter Branch: `develop` (or any existing branch)
4. Click "Connect Repository"
5. **Expected:** Documentation generates from that branch

---

### Test 3: Invalid Branch ❌
1. Click "Connect Repository"
2. Enter URL: `https://github.com/octocat/Hello-World`
3. Enter Branch: `nonexistent-branch-xyz`
4. Click "Connect Repository"
5. **Expected:** 
   - Error alert: "Branch 'nonexistent-branch-xyz' not found"
   - Modal stays open
   - Can fix and retry

---

### Test 4: Empty Branch (Auto-detect) ✅
1. Click "Connect Repository"
2. Enter URL: `https://github.com/torvalds/linux`
3. Delete Branch field content (leave empty)
4. Click "Connect Repository"
5. **Expected:** Auto-detects "master" branch

---

### Test 5: Loading State ✅
1. Click "Connect Repository"
2. Enter valid URL and branch
3. Click "Connect Repository"
4. **Expected:**
   - Button changes to "Connecting..."
   - Button is disabled
   - Can't close modal during submission

---

## Visual Testing

### UI Elements to Verify

**Modal Layout:**
```
┌─────────────────────────────────────┐
│ Connect Repository             [×]  │
├─────────────────────────────────────┤
│ GitHub URL *                        │
│ [https://github.com/owner/repo]     │
│                                     │
│ Description                         │
│ [What does this repository do?]    │
│                                     │
│ Branch                              │
│ [main                          ]    │
│ Specify which branch to generate... │
│                                     │
│ ☐ Commit generated README.md...    │
│                                     │
│         [Cancel] [Connect Repo]     │
└─────────────────────────────────────┘
```

---

## Error Message Testing

### Test Each Error Type

1. **Branch Not Found:**
   ```
   Branch "xyz" not found in owner/repo. 
   Please check the branch name and try again.
   ```

2. **Rate Limit (after many requests):**
   ```
   GitHub API rate limit exceeded. 
   Please try again later or contact support to add a token.
   ```

3. **Repository Not Found:**
   ```
   Repository not found. 
   Please check the URL and ensure the repository is public.
   ```

---

## Backend Testing

### Check Logs

When testing, watch backend logs for:

```
[FETCH] Input type: url
[FETCH] Fetching GitHub repo: https://github.com/...
[FETCH] Using GitHub API (no local storage, no git operations)
📥 Downloading repository: owner/repo (branch: develop)
Fetching branch info from: https://api.github.com/.../branches/develop
```

### Error Logs

For invalid branch:
```
Branch 'xyz' not found in owner/repo. 
Please check the branch name and try again.
ERROR
```

---

## Integration Testing

### Full Flow Test

1. **Start Backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Complete Flow:**
   - Login to app
   - Go to Repositories page
   - Click "Connect Repository"
   - Enter GitHub URL
   - Select custom branch (e.g., "develop")
   - Submit form
   - Verify documentation generates
   - Check branch used in logs

---

## Edge Cases to Test

### 1. Whitespace Handling
- Input: `" develop "`
- Expected: Trimmed to `"develop"`

### 2. Case Sensitivity
- Input: `"MAIN"` vs `"main"`
- Expected: Case preserved (GitHub is case-sensitive)

### 3. Special Characters
- Input: `"release/v1.0"`
- Expected: Passed correctly to GitHub API

### 4. Unicode/Emoji
- Input: `"feature/🚀-awesome"`
- Expected: Handled if GitHub allows

---

## Browser Testing

Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if available)

**Check:**
- Input field works
- Error alerts display
- Modal doesn't close on error
- Loading state shows

---

## API Testing (Manual)

### Using cURL

**Test with custom branch:**
```bash
curl -X POST http://localhost:8000/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "input_type=url" \
  -F "input_data=https://github.com/owner/repo" \
  -F "branch=develop" \
  -F "commit_to_github=false"
```

**Expected Response (Success):**
```json
{
  "readme": "# Repository Name\n...",
  "summaries": {...},
  "visuals": {...}
}
```

**Expected Response (Error - Invalid Branch):**
```json
{
  "detail": "Branch 'xyz' not found in owner/repo. Please check the branch name and try again."
}
```
Status Code: 400

---

## Performance Testing

### Metrics to Check

1. **API Response Time:**
   - Should complete within 30-60 seconds for most repos
   - Larger repos may take longer

2. **Rate Limiting:**
   - Without token: 60 requests/hour
   - With token: 5000 requests/hour

3. **Error Response Time:**
   - Invalid branch: < 5 seconds (quick failure)
   - Rate limit: Immediate

---

## Regression Testing

### Ensure These Still Work

1. ✅ **Default branch (no input):** Still works
2. ✅ **"Commit to GitHub" checkbox:** Still functional
3. ✅ **Existing repos list:** Displays correctly
4. ✅ **View documentation:** Still accessible
5. ✅ **Delete repo:** Still works
6. ✅ **Retry generation:** Still works

---

## User Acceptance Testing

### User Scenarios

**Scenario 1: Developer wants docs from dev branch**
- User: "I want docs from my development branch"
- Action: Enter "develop" in branch field
- Result: ✅ Docs generated from develop branch

**Scenario 2: User makes typo in branch name**
- User: Enters "devlop" instead of "develop"
- Action: Submit form
- Result: ✅ Clear error, can fix without re-entering URL

**Scenario 3: User unsure of branch name**
- User: Leaves default "main"
- Action: Submit form
- Result: ✅ Auto-detects main or master

---

## Checklist Before Release

- [ ] All test cases pass
- [ ] Error messages are clear and helpful
- [ ] Modal behavior correct (closes on success, stays on error)
- [ ] Loading states work
- [ ] Backend logs are informative
- [ ] No console errors in browser
- [ ] Mobile responsive (if applicable)
- [ ] Documentation updated
- [ ] Edge cases handled

---

## Quick Smoke Test (2 minutes)

1. ✅ Connect repo with default branch → Works
2. ✅ Connect repo with custom branch → Works
3. ✅ Connect repo with invalid branch → Shows error
4. ✅ Error doesn't close modal → Can retry
5. ✅ Loading state displays → Button shows "Connecting..."

**If all 5 pass → Feature is working! 🎉**

---

## Troubleshooting

### Issue: Branch field not showing
**Fix:** Clear browser cache, refresh page

### Issue: Error alert not showing
**Fix:** Check browser console for JavaScript errors

### Issue: Modal closes on error
**Fix:** Check repoStore.jsx error handling logic

### Issue: Backend 500 error
**Fix:** Check backend logs, ensure `requests` module imported

---

## Success Criteria

✅ User can select any branch  
✅ Errors are user-friendly  
✅ Modal behavior is intuitive  
✅ No breaking changes  
✅ Performance acceptable  
✅ Works across browsers  

**All criteria met → Ship it! 🚀**
