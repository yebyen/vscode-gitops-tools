# Design: Restore Streaming/Live-Update Feature

## Problem Summary

The live-update feature was implemented in v0.25.x (October 2023) using:
1. `kubectl proxy -p 0` to create a local HTTP proxy to the Kubernetes API
2. `@kubernetes/client-node` to connect via the proxy
3. Kubernetes **informers** to watch Flux resources and receive add/update/delete events
4. Custom TreeView data providers that updated nodes in response to informer events

VS Code 1.85 (November 2023) introduced "Sticky Scroll in tree views" which changed TreeView rendering behavior. The extension's aggressive TreeView updates conflicted with these changes, causing:
- UI elements overlapping
- Unresponsive context menus
- Visual glitches during expand/collapse

## Root Cause Analysis

The original implementation pushed TreeView updates without proper coordination with VS Code's rendering cycle. Key issues:

1. **Undocumented TreeView behavior**: The implementation relied on observed TreeView behavior that wasn't part of the official API contract
2. **Rapid-fire updates**: Informer events triggered immediate `refresh()` calls without debouncing
3. **Node caching conflicts**: Custom node caching conflicted with VS Code 1.85's new tree rendering pipeline

## Architecture (v0.26.0 - Broken)

```
┌─────────────────────────────────────────────────────────────┐
│ VS Code Extension Host                                      │
│  ┌──────────────┐    ┌──────────────────────────────────┐   │
│  │ kubectl proxy│───▶│ @kubernetes/client-node          │   │
│  │ (child proc) │    │  - CoreV1Api                     │   │
│  └──────────────┘    │  - CustomObjectsApi              │   │
│         │            │  - Informers (watch Flux CRDs)   │   │
│         │            └──────────────┬───────────────────┘   │
│         │                           │                       │
│         │            ┌──────────────▼───────────────────┐   │
│         │            │ KubernetesObjectDataProvider     │   │
│         │            │  - add(obj) → redraw()           │   │
│         │            │  - update(obj) → redraw()        │   │
│         │            │  - delete(obj) → redraw()        │   │
│         │            └──────────────┬───────────────────┘   │
│         │                           │                       │
│         │            ┌──────────────▼───────────────────┐   │
│         │            │ VS Code TreeView                 │   │
│         │            │  (Sources / Workloads)           │   │
│         │            └──────────────────────────────────┘   │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│ Kubernetes API      │
│ (via proxy)         │
└─────────────────────┘
```

## Proposed Solution

### Option A: Debounced Updates with VS Code API Compliance (Recommended)

1. **Debounce informer events**: Batch rapid updates into single TreeView refresh calls
2. **Use standard TreeView patterns**: Follow VS Code's documented refresh patterns
3. **Incremental node updates**: Update only changed nodes instead of full tree redraws
4. **Test against VS Code 1.85+**: Ensure compatibility with current VS Code versions

### Option B: WebView-based Tree

Replace TreeView with a custom WebView that renders the tree. Provides full control but loses VS Code integration features (keyboard navigation, theming consistency).

### Option C: Polling with Smart Diff

Remove informers entirely. Poll with `kubectl get` every N seconds and diff results. Simpler but loses true real-time updates.

**Decision**: Option A - maintains the original vision while fixing compatibility.

## Key Files to Restore/Modify

From v0.26.0 (commit `d145e7a`), these files need to be brought back and fixed:

| File | Purpose |
|------|---------|
| `src/cli/kubernetes/kubectlProxy.ts` | Spawn and manage kubectl proxy process |
| `src/k8s/client.ts` | Create K8s API clients from proxy config |
| `src/k8s/createKubeProxyConfig.ts` | Build KubeConfig pointing at local proxy |
| `src/k8s/informers.ts` | Create and manage Kubernetes informers |
| `src/ui/treeviews/dataProviders/kubernetesObjectDataProvider.ts` | Handle add/update/delete from informers |
| `src/ui/treeviews/dataProviders/asyncDataProvider.ts` | Base class for async tree data |

## Fix Strategy

1. **Add debouncing to informer event handlers**:
   ```typescript
   // Instead of immediate redraw on every event
   informer.on('update', (obj) => {
     this.pendingUpdates.push(obj);
     this.scheduleRedraw(); // debounced, e.g., 100ms
   });
   ```

2. **Use TreeView.reveal() sparingly**: Avoid forcing tree state changes during rapid updates

3. **Respect collapsible state**: Don't auto-expand nodes during updates

4. **Test with VS Code 1.85+ tree behaviors**: Verify Sticky Scroll doesn't conflict

## Dependencies

- `@kubernetes/client-node`: ^0.16.2 (already in v0.26.0)
- VS Code engine: `^1.85.0` (update from `^1.63.0`)

## Risks

- VS Code TreeView behavior may change again in future versions
- Need extensive testing across VS Code versions
- kubectl proxy adds a child process that must be managed carefully