# Implementation Tasks

## Phase 1: Auth Probe Module

- [x] Create `src/k8s/authProbe.ts` with `ensureAuthenticated()` function
- [x] Implement auth state caching (session-scoped)
- [x] Add `resetAuthState()` function for context switches
- [x] Detect Azure device code patterns in stderr (`DeviceCodeCredential`, `login.microsoft.com/device`)
- [x] Add user-friendly notification when auth is required

## Phase 2: Data Provider Integration

- [x] Modify `sourceDataProvider.ts` to call `ensureAuthenticated()` before `Promise.all`
- [x] Modify `workloadDataProvider.ts` to call `ensureAuthenticated()` before `Promise.all`
- [x] Handle auth failure gracefully (show placeholder node or empty tree)
- [x] Add "Authentication Required" tree node type for failed auth state

## Phase 3: Context Switch Handling

- [x] Call `resetAuthState()` in `onDidChangeContext` handler (`treeViews.ts`)
- [x] Call `resetAuthState()` in `onDidChangeKubeconfigPath` handler
- [x] Ensure auth state resets when kubectl proxy restarts

## Phase 4: Error Handling & UX

- [x] Consolidate multiple auth error messages into single notification
- [x] Add "Open Login Page" action button to auth notification
- [x] Prevent console spam from parallel timeout errors
- [x] Log auth probe results to GitOps output channel

## Phase 5: Testing

- [ ] Test with expired Azure AD tokens
- [ ] Test with valid cached tokens (should not prompt)
- [ ] Test context switching between clusters
- [ ] Test cancelling device code authentication
- [ ] Verify tree views load after successful authentication