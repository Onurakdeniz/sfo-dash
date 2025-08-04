# Onboarding Flow Documentation

## Overview

The onboarding flow is a multi-step process that guides new users through setting up their workspace and company. It uses Zustand for state management with local storage persistence to ensure users don't lose their progress if they refresh the page.

## Architecture

### State Management

The onboarding flow uses Zustand with persistence:

```typescript
// src/stores/onboarding-store.ts
- Persists form data to localStorage
- Maintains current step progress
- Provides validation helpers
- Allows data reset after completion
```

### Key Components

1. **Onboarding Page** (`src/app/onboarding/page.tsx`)
   - Multi-step form interface
   - Workspace creation (Step 1)
   - Company creation (Step 2)
   - Auto-saves progress to localStorage

2. **API Endpoints**
   - `GET /api/onboarding/status` - Check current onboarding status
   - `POST /api/onboarding/workspace` - Create a new workspace
   - `POST /api/onboarding/workspace/{workspaceId}/company` - Add company to workspace
   - `GET /api/onboarding/complete` - Verify onboarding completion

3. **Debug Endpoints** (Development only)
   - `GET /api/debug/cleanup` - View data that would be deleted
   - `DELETE /api/debug/cleanup` - Clean up test onboarding data
   - `GET /api/debug/test-onboarding` - Get API documentation

## User Flow

1. **Initial Check**
   - System checks if user is authenticated
   - Checks onboarding status via API
   - If already completed, redirects to dashboard
   - If partially completed, resumes from last step

2. **Workspace Creation**
   - User enters workspace name
   - Slug is auto-generated (can be customized)
   - Optional description
   - Timezone and language settings
   - Data persisted to localStorage on change

3. **Company Creation**
   - Basic info: name, type, industry
   - Legal info: tax number, registry number
   - Contact: phone, email, website
   - Address: full Turkish address support
   - All fields auto-saved to localStorage

4. **Completion**
   - After successful company creation
   - localStorage is cleared
   - User redirected to dashboard

## Features

### Persistence
- Form data saved to localStorage automatically
- Survives page refreshes and browser restarts
- Cleared only after successful completion

### Validation
- Real-time validation for required fields
- Slug format validation (lowercase, numbers, hyphens)
- Email format validation
- Submit buttons disabled until valid

### Error Handling
- Clear error messages displayed
- Toast notifications for success/failure
- Graceful fallbacks for API errors

### Progress Tracking
- Visual progress indicators
- Step completion status
- Ability to go back to previous step

## Testing the Flow

### 1. Clean Start
```bash
# Clean up any existing test data
curl -X DELETE http://localhost:3001/api/debug/cleanup \
  -H "Cookie: your-auth-cookie"
```

### 2. Test Workspace Creation
```bash
curl -X POST http://localhost:3001/api/onboarding/workspace \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "name": "Test Workspace",
    "slug": "test-workspace",
    "description": "Test description",
    "settings": {
      "timezone": "Europe/Istanbul",
      "language": "tr"
    }
  }'
```

### 3. Test Company Creation
```bash
curl -X POST http://localhost:3001/api/onboarding/workspace/{workspaceId}/company \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "name": "Test Company",
    "fullName": "Test Company Ltd. Şti.",
    "companyType": "limited_sirket",
    "industry": "Technology",
    "employeesCount": "11-50"
  }'
```

### 4. Verify Completion
```bash
curl http://localhost:3001/api/onboarding/complete \
  -H "Cookie: your-auth-cookie"
```

## Troubleshooting

### Common Issues

1. **"Workspace already exists" error**
   - Use the cleanup endpoint to remove test data
   - Or use a different slug

2. **Form data lost on refresh**
   - Check localStorage: `onboarding-storage`
   - Ensure Zustand persist middleware is working

3. **Can't proceed to next step**
   - Check browser console for validation errors
   - Ensure all required fields are filled
   - Check network tab for API errors

### Debug Commands

```javascript
// In browser console

// View current onboarding state
localStorage.getItem('onboarding-storage')

// Clear onboarding state
localStorage.removeItem('onboarding-storage')

// Check Zustand store directly
useOnboardingStore.getState()
```

## Security Considerations

1. **Authentication Required**
   - All endpoints require valid session
   - Redirects to signin if not authenticated

2. **Authorization**
   - Users can only create/modify their own workspaces
   - Company creation requires workspace ownership

3. **Data Validation**
   - Server-side validation for all inputs
   - SQL injection prevention via parameterized queries
   - XSS prevention via React's built-in escaping

4. **Debug Endpoints**
   - Only available in development environment
   - Protected by environment check

## Future Enhancements

1. **Multi-workspace Support**
   - Allow users to create multiple workspaces
   - Workspace switching UI

2. **Invitation Flow**
   - Skip onboarding for invited users
   - Join existing workspace/company

3. **Import/Export**
   - Import company data from CSV
   - Export onboarding data

4. **Advanced Validation**
   - Turkish tax number validation
   - MERSIS number format check
   - Phone number formatting