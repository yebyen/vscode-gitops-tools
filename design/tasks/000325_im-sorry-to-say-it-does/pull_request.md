# Fix kubelogin auth timeout with parallel kubectl calls

## Summary
Fixes authentication failures when using Azure kubelogin with clusters that require device code authentication. The extension was spawning multiple parallel kubectl commands, each triggering independent auth prompts that would timeout before the user could complete any of them.

## Changes
- Add `src/k8s/authProbe.ts` module with `ensureAuthenticated()` function
- Probe authentication before making parallel kubectl API calls in data providers
- Detect Azure device code auth patterns and show single user-friendly notification
- Reset auth state on context changes, kubeconfig changes, and proxy restarts

## Root Cause
The `sourceDataProvider.ts` and `workloadDataProvider.ts` use `Promise.all` to fetch multiple resources in parallel. When Azure AD tokens are expired, each kubectl call triggers its own kubelogin process requesting device code auth. The 32-second timeout expires before the user can complete authentication, and all requests fail with "context deadline exceeded".

## Solution
Add an auth probe that runs a single lightweight kubectl command (`kubectl version`) before the parallel fetches. If auth fails, the user sees one clear notification instead of multiple timeout errors. After successful auth, parallel calls proceed normally.

## Testing
- Tested compilation with `npm run compile` ✓
- Tested linting with `npm run lint` ✓
- Manual testing requires Azure kubelogin setup with expired tokens