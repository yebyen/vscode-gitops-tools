# Add Flux v2.7+ and v2.8+ compatibility documentation

## Summary

This PR documents the compatibility analysis of the vscode-gitops-tools extension with Flux v2.7+ and v2.8+, and updates outdated API version references in comments.

## Changes

- Updated JSDoc comments in `helmRelease.ts` to reference `v1` APIs instead of deprecated `v1beta1`/`v2beta1`
- Added Flux version compatibility section to README.md clarifying support for Flux v2.0.0+
- Documented that the extension automatically handles API version negotiation

## Analysis Findings

The extension is **fully compatible** with Flux v2.7+ and v2.8+ because:

1. kubectl queries use kind names (e.g., `get Kustomization`) instead of hardcoded API versions
2. Flux CLI commands use stable output formats that haven't changed
3. The `flux trace` command dynamically passes apiVersion from resource metadata
4. Type definitions describe structure, not specific API versions

No breaking changes were found - only documentation improvements were needed.

## Testing

Code analysis completed. The changes are documentation-only (README and JSDoc comments), so no functional testing is required.