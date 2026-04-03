# Requirements: Kubelogin Parallel Authentication Bug

## Problem Statement

When using Azure kubelogin with EKS clusters (or any cluster requiring device code authentication), the VSCode GitOps extension triggers multiple parallel kubectl commands on startup. Each command spawns a separate kubelogin process that requests its own device code authentication. Since the user cannot complete multiple device code flows simultaneously, all requests timeout with "context deadline exceeded" errors.

## User Stories

### US-1: Single Authentication Flow
**As a** user with Azure AD/kubelogin configured for my cluster  
**I want** the extension to complete authentication before making parallel API calls  
**So that** I only need to authenticate once and don't see multiple timeout errors

### US-2: Clear Authentication Error
**As a** user whose cluster authentication has expired  
**I want** a single, clear notification telling me to re-authenticate  
**So that** I understand what action to take instead of seeing dozens of confusing errors

### US-3: Clear Auth Failure Options
**As a** user whose authentication has failed  
**I want** a modal dialog with clear choices: "Retry" or "Give Up"  
**So that** I can either try again or let the extension go quiet until I'm ready to interact with it

### US-4: Graceful Degradation
**As a** user whose cluster authentication doesn't work with the watcher/proxy mode  
**I want** the extension to stop polling and go dark rather than spam errors  
**So that** I don't feel forced to uninstall the extension

### US-5: Future Non-Watcher Mode (Deferred)
**As a** user with a simple cluster or incompatible auth setup  
**I want** the option to disable watcher/proxy mode and use manual refresh instead  
**So that** I can still use the extension even if the new machinery doesn't work for me

> **Note**: This is deferred for a future issue. We don't want to commit to supporting this unless we get bug reports, but the architecture should leave room for it.

## Acceptance Criteria

1. **AC-1**: When tokens are expired, only ONE device code authentication prompt should appear (not 5-10)
2. **AC-2**: Parallel kubectl API calls should wait for authentication to complete before executing
3. **AC-3**: All tree view providers (Clusters, Sources, Workloads, Templates) must use the auth check
4. **AC-4**: The `refreshAllTreeViews()` function should coordinate authentication before parallel refreshes
5. **AC-5**: If authentication fails, a **modal dialog** presents clear options: "Retry" or "Give Up"
6. **AC-6**: "Retry" attempts authentication again
7. **AC-7**: "Give Up" puts the extension in dormant mode - stops kubectl proxy, stops polling, goes dark
8. **AC-8**: In dormant mode, user can re-activate by clicking refresh or switching context
9. **AC-9**: The extension should never spam errors that make users want to uninstall

## Root Cause Analysis

The extension already has `ensureAuthenticated()` in `src/k8s/authProbe.ts`, but:

1. **Not all providers use it**: `clusterDataProvider.ts` and `templateDataProvider.ts` skip the auth check
2. **Parallel race condition**: `refreshAllTreeViews()` triggers all tree providers simultaneously; even providers that call `ensureAuthenticated()` may start their parallel kubectl calls before the first auth probe completes
3. **No coordination**: Each tree provider independently calls `Promise.all()` with multiple kubectl commands

## Affected Files

- `src/views/dataProviders/clusterDataProvider.ts` - Missing `ensureAuthenticated()` call
- `src/views/dataProviders/templateDataProvider.ts` - Missing `ensureAuthenticated()` call  
- `src/views/treeViews.ts` - `refreshAllTreeViews()` needs coordinated auth check
- `src/k8s/authProbe.ts` - May need enhancement to block until auth confirmed