# Implementation Tasks

## Core Fix

- [ ] Update `src/views/treeViews.ts`: Make `refreshAllTreeViews()` async and call `ensureAuthenticated()` before triggering any tree refreshes
- [ ] Update `src/views/treeViews.ts`: Make `refreshResourcesTreeViews()` async for consistency
- [ ] Update `src/views/dataProviders/clusterDataProvider.ts`: Add `ensureAuthenticated()` call at start of `buildTree()` before any kubectl calls
- [ ] Update `src/views/dataProviders/templateDataProvider.ts`: Add `ensureAuthenticated()` call at start of `buildTree()` before `getGitOpsTemplates()`

## Auth State Management & Modal Dialog

- [ ] Update `src/k8s/authProbe.ts`: Add `dormant` state (replaces `failed`) to prevent automatic retries
- [ ] Update `src/k8s/authProbe.ts`: When auth fails, show **modal dialog** with "Retry" and "Give Up" options
- [ ] Update `src/k8s/authProbe.ts`: "Retry" calls `resetAuthState()` + retries auth
- [ ] Update `src/k8s/authProbe.ts`: "Give Up" calls `enterDormantMode()` - extension goes quiet
- [ ] Add `enterDormantMode()` function that: sets state to `dormant`, calls `disposeKubeProxy()`, stops polling
- [ ] Ensure `resetAuthState()` changes `dormant` back to `unknown` to allow retry on next interaction

## Callers of refreshAllTreeViews

- [ ] Update all callers of `refreshAllTreeViews()` to await the result (search for usages in commands/*.ts and other files)
- [ ] Update `refreshWhenK8sContextChange()` callback to handle async refresh
- [ ] Update `detectK8sConfigPathChange()` callback to handle async refresh

## Testing

- [ ] Manual test: Configure kubelogin with expired token, open extension, verify only ONE device code prompt appears
- [ ] Manual test: Click "Give Up" in modal, verify extension goes dormant (no kubectl calls, proxy stopped)
- [ ] Manual test: While dormant, click refresh button, verify auth probe runs again
- [ ] Manual test: Click "Retry" in modal, verify auth probe runs again immediately
- [ ] Manual test: Complete authentication, verify all tree views populate correctly
- [ ] Manual test: Switch context while dormant, verify auth state resets and single auth check occurs
- [ ] Verify no regressions with non-Azure clusters (standard kubeconfig auth)

## Concessions & Deferred Work

> **IMPORTANT**: Document what we're NOT doing in this PR, for future reference.

### Concession 1: No "Non-Watcher Mode" Toggle (Deferred)
- We do NOT implement a fallback to pre-fork manual-refresh-only mode
- If users report watcher/proxy issues, we may add `gitops.useWatcherMode: false` setting later
- **Breadcrumb**: See design.md "Future: Non-Watcher Mode" section for implementation notes

### Concession 2: Global Auth State (Not Per-Context)
- Auth state is global, not tracked per-context
- Switching contexts resets auth state entirely
- May revisit if users work with multiple clusters with different auth requirements

### Concession 3: No Automatic Recovery
- Once in dormant mode, extension stays quiet until explicit user action
- We do NOT periodically retry auth in background
- This is intentional: avoid annoying users whose auth is broken

## Future Enhancements (Out of Scope)

- [ ] Add VS Code setting `gitops.useWatcherMode` to disable proxy/watcher machinery entirely
- [ ] Add per-context auth state tracking for multi-cluster workflows
- [ ] Add status bar indicator showing dormant/authenticated state