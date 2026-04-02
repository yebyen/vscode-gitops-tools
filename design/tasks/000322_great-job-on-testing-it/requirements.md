# Requirements: Restore Streaming/Live-Update Feature

## Background

The GitOps Tools extension had a live-update feature (released October 2023 in v0.25.x) that enabled real-time streaming from the Kubernetes API. This feature was rolled back in v0.27.0 because VS Code 1.85 (November 2023) broke the TreeView rendering, causing UI glitches and overlapping elements.

## User Stories

### US-1: Real-time Cluster State Updates
**As a** GitOps user  
**I want** the Sources and Workloads tree views to update automatically  
**So that** I don't have to manually click refresh to see the current state of my Flux resources

### US-2: Responsive UI Without Glitches
**As a** VS Code user on version 1.85+  
**I want** the extension UI to render correctly without overlapping elements  
**So that** I can use the extension without visual artifacts or unresponsive menus

### US-3: Graceful Fallback
**As a** user with limited RBAC permissions  
**I want** the extension to fall back to kubectl-based polling  
**So that** I can still use the extension even without `watch` permissions on Flux resources

## Acceptance Criteria

### AC-1: Streaming via kubectl proxy
- [ ] Extension spawns `kubectl proxy -p 0` for the selected cluster
- [ ] Extension connects to proxy using `@kubernetes/client-node`
- [ ] Informers are created for all Flux resource types (Sources and Workloads)
- [ ] Add/update/delete events from informers update the tree view in real-time

### AC-2: VS Code 1.85+ Compatibility
- [ ] TreeView renders correctly without overlapping elements
- [ ] Expand/collapse operations work smoothly
- [ ] Context menus remain responsive
- [ ] No UI glitches during rapid updates from informers

### AC-3: Proxy Lifecycle Management
- [ ] Proxy process is started when extension activates
- [ ] Proxy is restarted on context switch
- [ ] Proxy is stopped when extension deactivates
- [ ] Orphaned proxy processes are cleaned up (no zombie `kubectl` processes)

### AC-4: Fallback Behavior
- [ ] If proxy connection fails, fall back to `kubectl get` polling
- [ ] User is not blocked from using the extension if streaming fails

## Constraints

- Must work with VS Code 1.85.0 and later
- Must work with Flux 2.0+ through 2.8+
- Must not spawn excessive `kubectl` processes (issue #490)
- Extension engine should target `^1.85.0` minimum