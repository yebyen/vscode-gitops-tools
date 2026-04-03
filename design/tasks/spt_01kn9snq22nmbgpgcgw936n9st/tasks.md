# Implementation Tasks

## Core Fix

- [ ] Update `src/views/treeViews.ts`: Make `refreshAllTreeViews()` async and call `ensureAuthenticated()` before triggering any tree refreshes
- [ ] Update `src/views/treeViews.ts`: Make `refreshResourcesTreeViews()` async for consistency
- [ ] Update `src/views/dataProviders/clusterDataProvider.ts`: Add `ensureAuthenticated()` call at start of `buildTree()` before any kubectl calls
- [ ] Update `src/views/dataProviders/templateDataProvider.ts`: Add `ensureAuthenticated()` call at start of `buildTree()` before `getGitOpsTemplates()`

## Callers of refreshAllTreeViews

- [ ] Update all callers of `refreshAllTreeViews()` to await the result (search for usages in commands/*.ts and other files)
- [ ] Update `refreshWhenK8sContextChange()` callback to handle async refresh
- [ ] Update `detectK8sConfigPathChange()` callback to handle async refresh

## Testing

- [ ] Manual test: Configure kubelogin with expired token, open extension, verify only ONE device code prompt appears
- [ ] Manual test: Complete authentication, verify all tree views populate correctly
- [ ] Manual test: Switch context, verify auth state resets and single auth check occurs
- [ ] Verify no regressions with non-Azure clusters (standard kubeconfig auth)

## Optional Enhancements

- [ ] Consider adding a "Retry Authentication" button to the notification when auth fails
- [ ] Consider caching auth state per-context (currently global) for multi-cluster workflows