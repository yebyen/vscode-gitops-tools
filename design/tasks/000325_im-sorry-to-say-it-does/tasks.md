# Implementation Tasks

## Phase 1: Auth Probe Module

- [ ] Create `src/k8s/authProbe.ts` with `ensureAuthenticated()` function
- [ ] Implement auth state caching (session-scoped)
- [ ] Add `resetAuthState()` function for context switches
- [ ] Detect Azure device code patterns in stderr (`DeviceCodeCredential`, `login.microsoft.com/device`)
- [ ] Add user-friendly notification when auth is required

## Phase 2: Data Provider Integration

- [ ] Modify `sourceDataProvider.ts` to call `ensureAuthenticated()` before `Promise.all`
- [ ] Modify `workloadDataProvider.ts` to call `ensureAuthenticated()` before `Promise.all`
- [ ] Handle auth failure gracefully (show placeholder node or empty tree)
- [ ] Add "Authentication Required" tree node type for failed auth state

## Phase 3: Context Switch Handling

- [ ] Call `resetAuthState()` in `onDidChangeContext` handler (`treeViews.ts`)
- [ ] Call `resetAuthState()` in `onDidChangeKubeconfigPath` handler
- [ ] Ensure auth state resets when kubectl proxy restarts

## Phase 4: Error Handling & UX

- [ ] Consolidate multiple auth error messages into single notification
- [ ] Add "Open Login Page" action button to auth notification
- [ ] Prevent console spam from parallel timeout errors
- [ ] Log auth probe results to GitOps output channel

## Phase 5: Testing

- [ ] Test with expired Azure AD tokens
- [ ] Test with valid cached tokens (should not prompt)
- [ ] Test context switching between clusters
- [ ] Test cancelling device code authentication
- [ ] Verify tree views load after successful authentication