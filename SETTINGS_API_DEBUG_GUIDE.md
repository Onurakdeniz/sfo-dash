# Settings API Debug Guide

## Summary of Analysis

The settings API has been thoroughly analyzed and appears to be **correctly implemented**. Here's what we found:

### ✅ What's Working Correctly

1. **Database Schema**: Both `workspace_settings` and `company_settings` tables are properly defined and migrated
2. **API Endpoints**: Both workspace and company settings APIs are responding correctly
3. **Authentication**: Proper auth checks are in place
4. **Table Relationships**: Foreign keys and relations are correctly set up
5. **Frontend Components**: React components are properly structured

### 🔍 Likely Issues and Solutions

Since the code appears correct, the issues are likely environmental or data-related:

#### 1. **Database State Issues**
- **Problem**: Settings tables may not be populated with initial data
- **Solution**: The APIs create default settings when none exist, but check if this is working

#### 2. **Authentication Context Issues**  
- **Problem**: Frontend may not be passing correct workspace/company IDs
- **Solution**: Check browser dev tools network tab for actual API calls

#### 3. **Data Flow Issues**
- **Problem**: Frontend components may not be handling API responses correctly
- **Solution**: Check React Query cache and error states

## Debugging Steps

### Step 1: Check Database Tables
```sql
-- Connect to your database and run:
SELECT COUNT(*) FROM workspace_settings;
SELECT COUNT(*) FROM company_settings;

-- Check if any settings exist:
SELECT * FROM workspace_settings LIMIT 5;
SELECT * FROM company_settings LIMIT 5;
```

### Step 2: Test API with Real Data
1. Open your app in browser
2. Navigate to settings page: `/[workspaceSlug]/[companySlug]/settings`
3. Open browser dev tools (F12)
4. Check Network tab for API calls
5. Look for specific error messages

### Step 3: Check Console Logs
The APIs have extensive console logging. Check both:
- Browser console for frontend errors
- Server console for backend errors

### Step 4: Manual API Testing
Use the test script we created:
```bash
node test-settings-api.js
```

Then test with authentication using browser dev tools or Postman.

## Common Issues and Fixes

### Issue 1: "Workspace not found"
- **Cause**: Workspace ID mismatch between frontend and backend
- **Fix**: Verify the workspace context API is returning correct IDs

### Issue 2: "Settings not saving"
- **Cause**: PATCH request not reaching the database
- **Fix**: Check request payload and database permissions

### Issue 3: "Company not found in workspace"
- **Cause**: Company-workspace relationship not established
- **Fix**: Verify `workspace_companies` junction table has correct records

### Issue 4: "Default settings not created"
- **Cause**: Database insert permissions or transaction issues
- **Fix**: Check database user permissions and error logs

## Quick Fix Commands

### Reset Settings Tables (Development Only)
```sql
-- Clear existing settings
DELETE FROM workspace_settings;
DELETE FROM company_settings;
```

### Force Create Default Settings
The API will automatically create default settings when none exist. Just make a GET request to trigger this.

## Code Locations

- **Workspace Settings API**: `src/app/api/settings/workspace/route.ts`
- **Company Settings API**: `src/app/api/settings/company/route.ts`  
- **Settings Tables Schema**: `src/db/schema/tables/settings.ts`
- **Frontend Components**: 
  - `src/app/[workspaceSlug]/[companySlug]/settings/page.tsx`
  - `src/app/[workspaceSlug]/[companySlug]/settings/workspace/page.tsx`
  - `src/app/[workspaceSlug]/[companySlug]/settings/company/page.tsx`

## Next Steps

1. **Run database checks** to ensure tables exist and have data
2. **Test with browser dev tools** to see actual API calls and responses
3. **Check server logs** for detailed error messages
4. **Verify workspace/company relationships** in the database

The code is solid - the issue is likely environmental or data-related!