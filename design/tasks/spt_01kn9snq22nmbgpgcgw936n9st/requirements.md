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

### US-3: Easily Dismissable Auth Prompt
**As a** user with Azure AD tokens that last 90 days  
**I want** to easily dismiss spurious authentication prompts  
**So that** I'm not blocked when tokens resolve themselves or when I know auth will succeed shortly

### US-4: Stop Requests After Auth Failure
**As a** user whose authentication has failed  
**I want** the extension to stop making kubectl requests until I explicitly retry  
**So that** I don't see a flood of errors and can work on resolving the auth issue

## Acceptance Criteria

1. **AC-1**: When tokens are expired, only ONE device code authentication prompt should appear (not 5-10)
2. **AC-2**: Parallel kubectl API calls should wait for authentication to complete before executing
3. **AC-3**: All tree view providers (Clusters, Sources, Workloads, Templates) must use the auth check
4. **AC-4**: The `refreshAllTreeViews()` function should coordinate authentication before parallel refreshes
5. **AC-5**: If authentication fails, subsequent kubectl calls should be blocked until auth state is reset
6. **AC-6**: The authentication notification must be easily dismissable (not modal/blocking)
7. **AC-7**: After dismissing an auth prompt, no further kubectl requests should be fired until user explicitly triggers a refresh
8. **AC-8**: Tokens that last 90 days mean most auth prompts are spurious - the UX should accommodate this reality

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