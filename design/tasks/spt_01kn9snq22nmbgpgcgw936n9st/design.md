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
3. User sees **modal dialog** with clear options: "Retry" or "Give Up"
4. "Retry" → reset auth state and try again
5. "Give Up" → enter **dormant mode**: stop kubectl proxy, stop polling, go dark
6. In dormant mode, user can re-activate via manual refresh or context switch

## Modal Auth Dialog Design

When auth fails, show a modal dialog (not a dismissable notification):

```typescript
const choice = await window.showErrorMessage(
  'Kubernetes authentication failed. Would you like to retry or let the extension go dormant?',
  { modal: true },
  'Retry',
  'Give Up'
);

if (choice === 'Retry') {
  resetAuthState();
  refreshAllTreeViews();
} else {
  // "Give Up" or dialog closed
  enterDormantMode();
}
```

**Rationale**: We unilaterally imposed the watcher/proxy interaction style in our fork. If it doesn't work for some users, they shouldn't be forced to uninstall. The extension should gracefully go quiet.

### Auth State Machine

```
UNKNOWN ──(probe succeeds)──► AUTHENTICATED
    │                              │
    │                              │ (context change / manual refresh)
    └──(probe fails)──► PROMPTING ─┤
                            │      │
              (user: Retry) │      │ (user: Give Up)
                            ▼      ▼
                        UNKNOWN  DORMANT
                                   │
                                   │ (context change / manual refresh)
                                   ▼
                                UNKNOWN
```

### Updated `authProbe.ts` State

```typescript
type AuthState = 'unknown' | 'authenticated' | 'dormant';
let authState: AuthState = 'unknown';

export async function ensureAuthenticated(): Promise<boolean> {
  if (authState === 'authenticated') return true;
  if (authState === 'dormant') return false; // Extension is dormant, don't retry
  
  // ... probe logic, show modal on failure
}

export function enterDormantMode() {
  authState = 'dormant';
  disposeKubeProxy(); // Stop the kubectl proxy
  // Trees will show empty state
}

export function resetAuthState() {
  authState = 'unknown'; // Allow retry on next interaction
}
```

## Dormant Mode Behavior

When the extension enters dormant mode:

1. **Stop kubectl proxy**: Call `disposeKubeProxy()` to stop background connections
2. **Stop polling**: No automatic kubectl calls
3. **Go dark**: Tree views show empty state, no error spam
4. **Silent until interaction**: Extension does nothing until user explicitly:
   - Clicks refresh button on a tree view
   - Switches kubectl context
   - Runs a command from the command palette

This ensures users don't feel forced to uninstall the extension if auth doesn't work.

## Future: Non-Watcher Mode (Deferred)

> **BREADCRUMB FOR FUTURE IMPLEMENTATION**
> 
> If we receive bug reports about the watcher/proxy machinery not working for certain users,
> we should add a third option: "Use Manual Refresh Mode"
> 
> This would:
> 1. Disable kubectl proxy entirely
> 2. Disable informer/watcher-based updates
> 3. Fall back to the pre-fork behavior: manual refresh button triggers kubectl calls
> 4. Store preference in VS Code settings: `gitops.useWatcherMode: false`
> 
> **Why defer**: We don't want to commit to supporting this unless we get bug reports.
> The old polling mode is less efficient but more compatible. Simple clusters may prefer it.
> 
> **Architecture note**: The current fix should structure `ensureAuthenticated()` and dormant mode
> in a way that makes adding this toggle straightforward later.