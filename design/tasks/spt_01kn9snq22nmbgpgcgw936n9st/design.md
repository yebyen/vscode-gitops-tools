# Design: Kubelogin Parallel Authentication Fix

## Architecture Overview

The fix requires coordinating authentication across all tree view providers before any parallel kubectl calls are made.

## Current Flow (Buggy)

```
refreshAllTreeViews()
  ├── refreshClustersTreeView()  ─→ clusterDataProvider.buildTree()
  │                                    └── Promise.all([getContexts, getCurrentContext])
  │                                    └── getFluxControllers()  ← NO AUTH CHECK
  │
  ├── refreshSourcesTreeView()   ─→ sourceDataProvider.buildTree()
  │                                    └── ensureAuthenticated()  ← checks auth
  │                                    └── Promise.all([5 kubectl calls])
  │
  ├── refreshWorkloadsTreeView() ─→ workloadDataProvider.buildTree()
  │                                    └── ensureAuthenticated()  ← checks auth
  │                                    └── Promise.all([4 kubectl calls])
  │
  └── refreshTemplatesTreeView() ─→ templateDataProvider.buildTree()
                                       └── getGitOpsTemplates()  ← NO AUTH CHECK
```

**Problem**: All providers start nearly simultaneously, resulting in 10+ parallel kubectl commands hitting kubelogin at once.

## Proposed Solution

### Option A: Centralized Auth Gate (Recommended)

Add a single authentication check in `refreshAllTreeViews()` before triggering any tree refreshes:

```typescript
export async function refreshAllTreeViews() {
  const isAuthed = await ensureAuthenticated();
  if (!isAuthed) {
    // Show auth required state in all trees
    return;
  }
  
  refreshClustersTreeView();
  refreshResourcesTreeViews();
}
```

**Pros**: Single point of control, simpler to maintain
**Cons**: Slight delay before trees start loading

### Option B: Sequential Auth with Parallel Data

Keep auth checks in providers but ensure they serialize:

1. First provider to call `ensureAuthenticated()` does the probe
2. Other providers await the same promise (already implemented)
3. All providers wait for auth before making kubectl calls

**Current `authProbe.ts` already handles this via `authCheckInProgress` promise sharing.**

The actual bug is that `clusterDataProvider` and `templateDataProvider` skip the check entirely.

## Chosen Approach

**Option A** - Centralized auth gate in `refreshAllTreeViews()` because:

1. Guarantees auth happens before ANY kubectl calls
2. Single place to handle auth failures
3. Prevents future bugs when adding new providers

## Key Changes

### 1. Update `treeViews.ts`

```typescript
import { ensureAuthenticated } from '../k8s/authProbe';

export async function refreshAllTreeViews() {
  const isAuthed = await ensureAuthenticated();
  if (!isAuthed) {
    // Trees will show empty/error state
    return;
  }
  refreshClustersTreeView();
  refreshResourcesTreeViews();
}
```

### 2. Keep Auth Checks in Data Providers (Defense in Depth)

Keep the existing `ensureAuthenticated()` calls in `sourceDataProvider.ts` and `workloadDataProvider.ts` as a safety net.

### 3. Add Auth Check to Missing Providers

Add `ensureAuthenticated()` to:
- `clusterDataProvider.ts` - before `getFluxControllers()`
- `templateDataProvider.ts` - before `getGitOpsTemplates()`

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Keep `authProbe.ts` singleton pattern | Already handles concurrent calls correctly |
| Don't remove individual provider checks | Defense in depth; providers may be called directly |
| Gate at `refreshAllTreeViews()` level | Catches all refresh scenarios including context switches |
| Show empty tree on auth failure | Better UX than partial loading with errors |

## Error Handling

When authentication fails:
1. `ensureAuthenticated()` returns `false`
2. Tree providers return empty arrays
3. User sees "Authentication required" notification (easily dismissable, not modal)
4. Auth state is marked as "failed" - subsequent kubectl calls are blocked
5. Auth state resets on context change OR explicit user action (refresh button)

## Dismissable Auth Prompt Design

Since Azure AD tokens last 90 days, most auth prompts are spurious (temporary network issues, token refresh in progress, etc.). The UX must accommodate this:

1. **Non-blocking notification**: Use `window.showWarningMessage()` not modal dialogs
2. **Easy dismiss**: User can close notification without consequence
3. **No request flood after dismiss**: Once auth fails, stop all kubectl requests until:
   - User clicks "Retry" button in notification
   - User manually triggers tree refresh
   - User switches context (which resets auth state)

### Auth State Machine

```
UNKNOWN ──(probe succeeds)──► AUTHENTICATED
    │                              │
    │                              │ (context change)
    └──(probe fails)──► FAILED ◄──┘
                           │
                           │ (user retry / refresh)
                           ▼
                        UNKNOWN
```

### Updated `authProbe.ts` State

```typescript
type AuthState = 'unknown' | 'authenticated' | 'failed';
let authState: AuthState = 'unknown';

export function ensureAuthenticated(): Promise<boolean> {
  if (authState === 'authenticated') return Promise.resolve(true);
  if (authState === 'failed') return Promise.resolve(false); // Don't retry automatically
  // ... probe logic
}

export function resetAuthState() {
  authState = 'unknown'; // Allow retry
}
```