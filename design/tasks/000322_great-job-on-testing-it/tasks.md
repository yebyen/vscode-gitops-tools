# Implementation Tasks

## Phase 1: Research & Preparation

- [x] Study VS Code 1.85+ TreeView changes and Sticky Scroll implementation
- [x] Review VS Code TreeDataProvider documentation for proper refresh patterns
- [x] Extract streaming code from v0.26.0 (commit `d145e7a`) for reference
- [x] Set up test environment with VS Code 1.85+ and Flux 2.8

## Phase 2: Restore kubectl Proxy Infrastructure

- [x] Restore `src/cli/kubernetes/kubectlProxy.ts` with proxy lifecycle management
- [x] Restore `src/k8s/createKubeProxyConfig.ts` for building proxy KubeConfig
- [x] Restore `src/k8s/client.ts` for creating K8s API clients
- [x] Add proper cleanup on extension deactivation to prevent zombie processes
- [x] Test proxy start/stop/restart on context switches

## Phase 3: Restore Informers with Fixes

- [x] Restore `src/k8s/informers.ts` with Flux resource watchers
- [x] Add debouncing to informer event handlers (100-200ms batching)
- [x] Handle informer errors gracefully (stop and fall back to polling)
- [~] Test informers with Sources: GitRepository, HelmRepository, OCIRepository, Bucket
- [~] Test informers with Workloads: Kustomization, HelmRelease

## Phase 4: Fix TreeView Data Providers

- [ ] Restore `src/ui/treeviews/dataProviders/asyncDataProvider.ts`
- [ ] Restore `src/ui/treeviews/dataProviders/kubernetesObjectDataProvider.ts`
- [ ] Implement debounced `redraw()` that batches pending updates
- [ ] Avoid calling `TreeView.reveal()` during rapid updates
- [ ] Preserve expand/collapse state during updates
- [ ] Test add/update/delete operations don't cause UI glitches

## Phase 5: VS Code 1.85+ Compatibility Testing

- [ ] Test expand/collapse operations with Sticky Scroll enabled
- [ ] Test context menu responsiveness during informer updates
- [ ] Verify no overlapping UI elements during rapid state changes
- [ ] Test with large clusters (100+ Kustomizations, 50+ HelmReleases)
- [ ] Test extension reload and window reload scenarios

## Phase 6: Fallback & Error Handling

- [ ] Implement fallback to `kubectl get` polling if proxy fails
- [ ] Add user-visible status when streaming is active vs polling
- [ ] Handle RBAC errors (no watch permission) gracefully
- [ ] Test behavior when cluster becomes unreachable

## Phase 7: Cleanup & Release Prep

- [ ] Update `package.json` engine to `^1.85.0`
- [ ] Update CHANGELOG.md with streaming feature restoration
- [ ] Update README.md kubectl proxy section if needed
- [ ] Run full E2E test suite
- [ ] Manual testing on macOS, Windows, Linux