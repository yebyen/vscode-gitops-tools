# Design: kubelogin Authentication Timeout Bug

## Root Cause Analysis

The issue stems from how vscode-gitops-tools loads tree view data on activation. When building the Sources or Workloads tree views, the extension makes multiple kubectl API calls in parallel using `Promise.all`:

```typescript
// workloadDataProvider.ts L36-44
const [kustomizations, helmReleases, namespaces] = await Promise.all([
    kubernetesTools.getKustomizations(),
    kubernetesTools.getHelmReleases(),
    kubernetesTools.getNamespaces(),
    kubernetesTools.getAvailableResourceKinds(),
]);

// sourceDataProvider.ts L31-37
const [gitRepositories, ociRepositories, helmRepositories, buckets, namespaces] = await Promise.all([
    kubernetesTools.getGitRepositories(),
    kubernetesTools.getOciRepositories(),
    kubernetesTools.getHelmRepositories(),
    kubernetesTools.getBuckets(),
    kubernetesTools.getNamespaces(),
]);
```

Each call invokes `kubectl get <resource>`, which in turn triggers `kubelogin` for Azure AD authentication. When tokens are expired or missing:

1. **Multiple kubelogin processes spawn** - Each kubectl command starts its own kubelogin subprocess
2. **Each requests device code auth** - Azure's device code flow generates unique codes per request
3. **32-second timeout per request** - kubectl's default timeout expires before user can authenticate
4. **Race condition** - Even if user completes one auth flow, other parallel requests have already timed out

## Solution Options

### Option A: Auth Probe with Serialization (Recommended)

Before making parallel kubectl calls, perform a single "probe" request to establish authentication state.

**How it works:**
1. Add an async `ensureAuthenticated()` method that runs `kubectl cluster-info` (lightweight)
2. If probe fails with auth error, show user-friendly message and wait
3. If probe succeeds, authentication is established and parallel calls can proceed
4. Cache success state for session lifetime

**Pros:**
- Minimal code changes
- Preserves parallel fetching for performance after auth
- Clear UX flow

**Cons:**
- Adds one extra kubectl call on first load
- Need to detect auth-specific error patterns

### Option B: Sequential Initial Load

Change `Promise.all` to sequential awaits for the initial tree view build.

**Pros:**
- Simplest implementation
- Guarantees only one auth prompt

**Cons:**
- Slower tree view loading (5+ sequential calls)
- Still may timeout if user is slow to authenticate

### Option C: Mutex/Lock on kubectl Invocation

Add a global mutex that serializes all kubectl calls when auth state is unknown.

**Pros:**
- Comprehensive solution
- Works for all kubectl usage patterns

**Cons:**
- Complex implementation
- May cause deadlocks if not careful
- Performance impact throughout extension

## Chosen Approach: Option A

Implement an auth probe pattern before parallel kubectl operations.

## Architecture Changes

### New Module: `src/k8s/authProbe.ts`

```typescript
let isAuthenticated = false;
let authCheckInProgress: Promise<boolean> | null = null;

export async function ensureAuthenticated(): Promise<boolean> {
    if (isAuthenticated) return true;
    
    if (authCheckInProgress) {
        return authCheckInProgress;
    }
    
    authCheckInProgress = checkAuth();
    const result = await authCheckInProgress;
    authCheckInProgress = null;
    return result;
}

async function checkAuth(): Promise<boolean> {
    const result = await kubernetesTools.invokeKubectlCommand('cluster-info');
    if (result?.code === 0) {
        isAuthenticated = true;
        return true;
    }
    
    // Check for device code pattern in stderr
    if (result?.stderr?.includes('device') || result?.stderr?.includes('login')) {
        showAuthRequiredMessage(result.stderr);
        return false;
    }
    
    return false;
}

export function resetAuthState(): void {
    isAuthenticated = false;
}
```

### Modifications to Data Providers

In `sourceDataProvider.ts` and `workloadDataProvider.ts`:

```typescript
async buildTree(): Promise<NamespaceNode[]> {
    // Check auth before parallel fetches
    const authed = await ensureAuthenticated();
    if (!authed) {
        return []; // Or show "Authentication Required" node
    }
    
    // Existing Promise.all code...
}
```

### Context Switch Handling

Reset auth state when context changes in `treeViews.ts`:

```typescript
configuration.api.onDidChangeContext(_context => {
    resetAuthState();
    restartKubeProxy();
    refreshAllTreeViews();
});
```

## Error Detection Patterns

Recognize Azure device code auth requirements by checking stderr for:
- `"To sign in, use a web browser to open"`
- `"https://login.microsoft.com/device"`
- `"DeviceCodeCredential"`
- `"kubelogin failed with exit code 1"`

## User Experience

When authentication is required:
1. Show VS Code notification: "Azure authentication required. Please complete device code login."
2. Optionally include "Open Login Page" button
3. Tree views show "Authenticating..." or "Authentication Required" placeholder
4. After successful auth, automatically refresh tree views

## Key Decisions

1. **Auth probe happens once per context** - Not on every tree refresh
2. **Parallel calls remain after auth** - Performance preserved
3. **Graceful degradation** - Extension still works if probe fails (falls back to existing behavior)
4. **No timeout changes** - Keep default timeouts, fix the parallelism issue instead