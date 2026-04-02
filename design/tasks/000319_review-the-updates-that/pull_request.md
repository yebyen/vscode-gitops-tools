# Verify and document Flux v2.8 compatibility

## Summary

This PR verifies that the vscode-gitops-tools extension (v0.27.0) is fully compatible with the current version of Flux (v2.8.3), updates outdated API references in the codebase, and upgrades the CI pipeline to test against Flux 2.8.

## Background

The extension was last updated in January 2024. Since then, Flux has had two major releases with breaking API changes:

- **Flux v2.7.0** (Sep 2025): Removed deprecated `v1beta1` and `v2beta1` APIs
- **Flux v2.8.0** (Feb 2026): Removed deprecated `v1beta2` and `v2beta2` APIs, added Helm v4 support, new resource types (`ExternalArtifact`, `ArtifactGenerator`), and now requires Kubernetes 1.33+

The question was: **does this extension still work with modern Flux?**

## Compatibility Analysis

### Why the Extension Is Compatible (No Code Changes Needed)

The extension was well-architected with good abstraction layers:

| Area | How It Works | Why It's Compatible |
|------|-------------|-------------------|
| **kubectl queries** | Uses kind names like `get Kustomization -A -o json`, not versioned API paths | kubectl auto-resolves to the available API version |
| **Flux CLI commands** | Delegates to `flux check`, `flux tree`, `flux trace`, etc. | CLI handles version differences internally |
| **`flux trace`** | Dynamically passes `--api-version` from resource metadata | Automatically uses `v1` when resources report `v1` |
| **`flux check` parsing** | Looks for stable Unicode markers (`►`, `✔`, `✗`) in output | Output format unchanged between Flux v2.0 and v2.8 |
| **Type definitions** | Describe structure (field names/types), not API versions | `v1` resource structure is the same as `v1beta1`/`v2beta1` |

### What Was Outdated

- JSDoc comments in `helmRelease.ts` still referenced `v1beta1` API versions
- README had no mention of Flux version compatibility
- CI pipeline was pinned to an old Flux version and Kubernetes v1.28

## E2E Test Results

**Environment:** Flux CLI v2.8.3, Kubernetes v1.33.0 (kind v0.27.0), VS Code v1.114.0

```
  Extension Test Suite
    ✔ Extension is activated
    ✔ Current cluster is listed (88ms)
    ✔ Enable GitOps installs Flux (6148ms)
    ✔ Sources are listed (2268ms)
    ✔ OCI Sources are listed (4269ms)
    ✔ Kustomizations are listed (5232ms)
    ✔ Disable GitOps uninstalls Flux (635ms)

  7 passing (21s)
```

**All 7 tests pass.** The full lifecycle works end-to-end:
- Installing Flux v2.8.3 controllers on a cluster
- Creating and listing GitRepository sources (v1 API)
- Creating and listing OCIRepository sources (v1 API)
- Creating and listing Kustomization workloads (v1 API)
- Uninstalling Flux (including new v2.8 CRDs like ExternalArtifact)

## Changes

### `src/kubernetes/types/flux/helmRelease.ts`
- Updated JSDoc comments from `v1beta1`/`v2beta1` → `v1` to match current Flux API versions
- Updated `@see` doc links to point to v1 API documentation

### `README.md`
- Added "Flux Version Compatibility" section explaining support for Flux v2.0.0+ including v2.7+ and v2.8+
- Documented that the extension automatically handles API version negotiation

### `.github/workflows/ci.yml`
- Upgraded kind from v0.20.0 to v0.27.0
- Upgraded Kubernetes node image from v1.28.0 to v1.33.0 (required by Flux 2.8)
- Configured Flux CLI action to use version `2.8.x` (was pinned to old commit)
- Added `flux version --client` step to log installed Flux version
- Added `flux check --pre` step to verify prerequisites before tests

## Future Work (Not in This PR)

New Flux 2.7/2.8 resource types that could be added to the extension's tree views:
- `ExternalArtifact` — 3rd-party source controllers
- `ArtifactGenerator` — source composition/decomposition patterns
- `ImagePolicy`, `ImageRepository`, `ImageUpdateAutomation` — now GA at v1