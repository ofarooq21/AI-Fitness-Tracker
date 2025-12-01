# Daily Goals Backend Sync

## Overview
Daily goals now support full backend synchronization, allowing users to access their daily tasks across multiple devices and ensuring data persistence.

## Features

### Backend API Endpoints
- **GET /daily-goals?date=YYYY-MM-DD** - Retrieve all daily tasks for a specific date
- **POST /daily-goals** - Create a new daily task
- **PUT /daily-goals/{task_id}** - Update an existing daily task
- **DELETE /daily-goals/{task_id}** - Delete a daily task
- **POST /daily-goals/bulk** - Bulk create or update multiple tasks

### Data Model
```typescript
interface DailyTask {
  id: string;              // Frontend task ID (e.g., "water", "steps", or custom UUID)
  name: string;            // Display name
  type: "checkbox" | "counter";
  target?: number;         // For counter tasks
  unit?: string;           // Display unit (e.g., "cups", "steps")
  value?: number;          // Current value for counter tasks
  completed?: boolean;     // For checkbox tasks
  done?: boolean;          // Alias for completed (backend uses 'done')
  isCustom?: boolean;      // Whether this is a user-created custom task
  backendId?: string;      // Backend UUID for sync operations
}
```

### Frontend Behavior

#### Load Strategy
1. **Authenticated Users**: Fetch from backend first
   - On success: Display backend data and cache locally
   - On failure: Fall back to local storage
2. **Guest Users**: Use local storage only

#### Save Strategy
1. Save to local storage immediately (instant UI update)
2. If authenticated, sync to backend asynchronously
   - Uses bulk endpoint for efficiency
   - Silent fail if backend unavailable (local data preserved)

#### Sync Mechanism
- **On Load**: `loadDailyTasks()` fetches from backend if authenticated
- **On Save**: `saveDailyTasks()` saves locally then syncs to backend
- **Bulk Operations**: All tasks for a date are synced together for efficiency

### Database Schema

#### Collection: `daily_tasks`
```javascript
{
  _id: "uuid",                    // Backend-generated UUID
  user_id: "string",              // User identifier
  date: "YYYY-MM-DD",             // Task date
  task_id: "string",              // Frontend task identifier
  label: "string",                // Display name
  type: "checkbox" | "counter",   // Task type
  target: number | null,          // Target value for counters
  unit: string | null,            // Display unit
  current: number,                // Current value (0 for checkboxes)
  done: boolean,                  // Completion status
  is_custom: boolean,             // Custom task flag
  created_at: "datetime",         // Creation timestamp
  updated_at: "datetime"          // Last update timestamp
}
```

#### Indexes
- `user_id` (ascending)
- `user_id + date` (compound)
- `user_id + date + task_id` (compound, unique) - Prevents duplicate tasks
- `created_at` (descending)

## Cross-Device Sync

### How It Works
1. User logs in on Device A and creates/updates daily tasks
2. Tasks are saved to backend database
3. User logs in on Device B
4. Tasks are automatically loaded from backend
5. Any changes on Device B are synced back to backend
6. Changes are immediately available on Device A on next load

### Conflict Resolution
- **Last Write Wins**: The most recent update (by `updated_at` timestamp) is preserved
- **Bulk Sync**: On save, all current tasks are sent to backend, ensuring consistency
- **Unique Constraint**: Database prevents duplicate tasks for the same user/date/task_id

## Offline Support
- Local storage acts as primary cache
- App works fully offline for guest users
- Authenticated users can work offline; changes sync when connection restored
- No data loss if backend is temporarily unavailable

## Testing

### Manual API Tests
```bash
# Create a task
curl -X POST 'http://localhost:8000/daily-goals' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "test_user",
    "date": "2025-12-01",
    "task_id": "water",
    "label": "Drink Water",
    "type": "counter",
    "target": 8,
    "unit": "cups",
    "current": 3,
    "done": false,
    "is_custom": false
  }'

# Get tasks for a date
curl 'http://localhost:8000/daily-goals?date=2025-12-01'

# Update a task
curl -X PUT 'http://localhost:8000/daily-goals/{task_id}' \
  -H 'Content-Type: application/json' \
  -d '{"current": 8}'

# Bulk sync
curl -X POST 'http://localhost:8000/daily-goals/bulk' \
  -H 'Content-Type: application/json' \
  -d '[{...tasks...}]'
```

### Frontend Testing
1. Open app on Device A, log in
2. Create/update daily tasks
3. Open app on Device B with same account
4. Verify tasks appear correctly
5. Update tasks on Device B
6. Refresh Device A, verify changes appear

## Security
- All endpoints support optional authentication
- Authenticated users can only access their own tasks
- Guest users use `user_id: "guest"` (not synced across devices)
- Authorization checks on update/delete operations

## Performance
- **Bulk Operations**: Reduces API calls by syncing all tasks at once
- **Local Cache**: Instant UI updates, backend sync in background
- **Indexed Queries**: Fast lookups by user_id and date
- **Unique Constraints**: Prevents duplicate data

## Migration Notes
- Existing local storage data is preserved
- On first load after update, local tasks are synced to backend
- No data loss during migration
- Old tasks without `isCustom` flag are automatically marked as custom if not default tasks

## Future Enhancements
- Real-time sync using WebSockets
- Conflict resolution UI for simultaneous edits
- Sync status indicators in UI
- Offline queue for pending changes
- Task history and analytics

