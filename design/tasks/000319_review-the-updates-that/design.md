# Design: Flux Compatibility Analysis

## Summary

The vscode-gitops-tools extension (v0.27.0, January 2024) needs updates to work with Flux v2.7+ and v2.8+. Flux has removed deprecated API versions and added new features.

## Breaking Changes Analysis

### API Version Removals

| Flux Version | Removed APIs | Impact |
|--------------|--------------|--------|
| v2.7.0 | `v1beta1`, `v2beta1` | Older manifests won't work |
| v2.8.0 | `v1beta2`, `v2beta2` | Must use `v1` for all resources |

### Current Extension API Usage

The extension uses kubectl to query Flux resources:
- `helmreleases.helm.toolkit.fluxcd.io` 
- `gitrepositories.source.toolkit.fluxcd.io`
- `kustomizations.kustomize.toolkit.fluxcd.io`

**Finding**: Extension queries by kind name, not API version. This should continue working since Flux CRDs still serve these kinds—just at `v1` only.

### Flux CLI Changes

| Area | Change | Extension Impact |
|------|--------|------------------|
| `flux version` | Output format unchanged | ✅ Compatible |
| `flux check` | Output parsing | Verify format still matches |
| `flux tree` | JSON output | Verify structure unchanged |
| `flux trace` | API version flag | May need updates |

## New Features in Flux 2.7-2.8

### New Resource Types

1. **ExternalArtifact** (v2.7) - 3rd-party source controllers
2. **ArtifactGenerator** (v2.7) - Source composition patterns
3. **Image Automation APIs GA** (v2.7) - `ImagePolicy`, `ImageRepository`, `ImageUpdateAutomation` now v1

### New Capabilities

- Helm v4 support (v2.8)
- CEL expressions for readiness evaluation
- OpenTelemetry tracing for reconciliation
- Workload Identity for remote clusters

## Recommended Changes

### Priority 1: Verify Compatibility
- Test extension against Flux v2.8 cluster
- Verify kubectl queries return expected data
- Confirm `flux check` output parsing works

### Priority 2: Update Documentation
- Update README minimum Flux version
- Document any known limitations

### Priority 3: Feature Additions (Future)
- Support for new resource types in tree views
- Image Automation resources in Sources view

## Architecture Decision

**Decision**: Incremental compatibility approach

The extension uses kubectl and Flux CLI as abstractions. Since both tools handle API version negotiation automatically, most functionality should work without code changes. Testing is the primary task.

## Dependencies

- Flux CLI v2.7+ recommended for users
- kubectl with cluster access
- Kubernetes cluster running Flux v2.7+