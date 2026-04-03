# Requirements: kubelogin Authentication Timeout Bug

## Problem Statement

When using Azure kubelogin with an EKS cluster, the vscode-gitops-tools extension spawns multiple parallel kubectl commands that each trigger independent device code authentication prompts. Even when the user is already authenticated, these parallel requests fail with "context deadline exceeded" errors because:

1. Multiple kubectl processes spawn simultaneously (via `Promise.all`)
2. Each process triggers its own kubelogin authentication attempt
3. The 32-second timeout expires before interactive authentication can complete
4. The user sees multiple different device codes but cannot complete any authentication flow

## User Stories

### US-1: Authenticated User Can View GitOps Resources
**As** a user already authenticated to my Kubernetes cluster via Azure AD  
**I want** the GitOps extension to use my existing credentials  
**So that** I can view kustomizations, helm releases, and git repositories without re-authenticating

**Acceptance Criteria:**
- [ ] Extension uses cached kubelogin tokens when available
- [ ] No authentication prompts appear when tokens are still valid
- [ ] Tree views load successfully with existing credentials

### US-2: Sequential Authentication on Token Expiry
**As** a user whose Azure AD token has expired  
**I want** to see a single authentication prompt  
**So that** I can complete the device code flow without multiple competing prompts

**Acceptance Criteria:**
- [ ] Only one device code authentication prompt appears at a time
- [ ] Subsequent kubectl calls wait for the first authentication to complete
- [ ] All tree views refresh successfully after authentication completes

### US-3: Clear Error Messages on Auth Failure
**As** a user who cannot authenticate  
**I want** to see a clear error message explaining the authentication failure  
**So that** I can troubleshoot the issue

**Acceptance Criteria:**
- [ ] Authentication timeout errors are caught and displayed clearly
- [ ] User is informed that device code authentication is required
- [ ] Extension does not spam the console with multiple identical errors

## Technical Requirements

### TR-1: Serialize Initial kubectl Calls
- The parallel `Promise.all` calls for kustomizations, helm releases, git repositories, namespaces, and resource kinds must be serialized when authentication might be required
- After successful first call, subsequent calls can proceed in parallel

### TR-2: Token/Auth State Detection
- Before making kubectl calls, detect if authentication is likely to succeed
- Consider using a lightweight "probe" command (e.g., `kubectl cluster-info`) first
- Cache successful auth state to enable parallel calls

### TR-3: Timeout Handling
- Increase timeout for initial authentication scenarios OR
- Detect device code flow requirement and prompt user appropriately
- Avoid multiple simultaneous timeout errors flooding the output

## Out of Scope

- Fixing kubelogin itself
- Supporting non-Azure authentication providers (separate issue)
- Changes to the kubectl proxy mechanism (unless directly related to auth)