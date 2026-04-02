# Add Flux v2.7+ and v2.8+ compatibility documentation

## Summary

This PR verifies and documents the compatibility of the vscode-gitops-tools extension with Flux v2.7+ and v2.8+, updates outdated API version references, and upgrades the CI pipeline to test against Flux 2.8.

## Changes

- Updated JSDoc comments in `helmRelease.ts` to reference `v1` APIs instead of deprecated `v1beta1`/`v2beta1`
- Added Flux version compatibility section to `README.md` clarifying support for Flux v2.0.0+
- Updated CI workflow (`ci.yml`) to test against Flux 2.8.x with Kubernetes 1.33 and kind v0.27.0
- Added `flux version --client` and `flux check --pre` verification steps to CI

## Analysis Findings

The extension is **fully compatible** with Flux v2.7+ and v2.8+ because:

1. kubectl queries use kind names (e.g., `get Kustomization`) instead of hardcoded API versions
2. Flux CLI commands use stable output formats that haven't changed
3. The `flux trace` command dynamically passes apiVersion from resource metadata
4. Type definitions describe structure, not specific API versions

No breaking code changes were needed — only documentation and CI improvements.

## Testing

**E2E test suite run against Flux v2.8.3 + Kubernetes v1.33.0 (kind v0.27.0):**

| Test | Result | Time |
|------|--------|------|
| Extension is activated | ✅ Pass | — |
| Current cluster is listed | ✅ Pass | 88ms |
| Enable GitOps installs Flux | ✅ Pass | 6148ms |
| Sources are listed (GitRepository) | ✅ Pass | 2268ms |
| OCI Sources are listed (OCIRepository) | ✅ Pass | 4269ms |
| Kustomizations are listed | ✅ Pass | 5232ms |
| Disable GitOps uninstalls Flux | ✅ Pass | 635ms |

**7/7 tests passing.** Full end-to-end verification confirms install, create, list, delete, and uninstall workflows all work correctly with Flux 2.8.3.