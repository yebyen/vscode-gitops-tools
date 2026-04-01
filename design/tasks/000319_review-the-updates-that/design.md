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

## Code Analysis Findings

### 1. flux check Parsing (fluxTools.ts:65-125)

**Status: ✅ Compatible**

The `flux check` parsing looks for these markers:
- `► checking prerequisites`
- `► checking controllers`
- `✔ all checks passed`
- `► checking crds`

These output markers are part of the Flux CLI's stable output format and have not changed between Flux v2.0 and v2.8. The parsing logic is robust.

### 2. flux tree Parsing (fluxTools.ts:127-142)

**Status: ✅ Compatible**

Uses `flux tree kustomization <name> -n <namespace> -o json` and parses JSON output. The FluxTreeResources interface expects:
```typescript
interface FluxTreeResources {
  resource: {
    Namespace: string;
    Name: string;
    GroupKind: { Group: string; Kind: string; };
  };
  resources?: FluxTreeResources[];
}
```

This JSON structure is unchanged in Flux v2.8.

### 3. flux trace Command (fluxTools.ts:226-231)

**Status: ✅ Compatible**

Uses `flux trace <name> --kind=<kind> --api-version=<apiVersion> --namespace=<namespace>`. The `--api-version` flag is passed from the resource's actual `apiVersion` field, not hardcoded. This will automatically use the correct `v1` version when querying v2.7+ clusters.

### 4. kubectl Queries (kubernetesTools.ts)

**Status: ✅ Compatible**

All kubectl queries use kind names without API versions:
- `get Kustomization -A -o json`
- `get GitRepository -A -o json`
- `get OciRepository -A -o json`
- `get HelmRepository -A -o json`
- `get Bucket -A -o json`
- `get helmreleases.helm.toolkit.fluxcd.io -A -o json`

kubectl automatically resolves to the available API version. No changes needed.

### 5. Type Definitions (src/kubernetes/types/flux/*.ts)

**Status: ⚠️ Comments only, no code impact**

Found `v1beta1` references in helmRelease.ts comments:
- Line 34: "Chart defines the template of the v1beta1.HelmChart"
- Line 207: "@see https://github.com/fluxcd/helm-controller/blob/main/docs/api/helmrelease.md#helm.toolkit.fluxcd.io/v2beta1.HelmChartTemplate"
- Lines 222, 228, 233: References to v1beta1.GitRepository, v1beta1.Bucket, v1beta1.Source

These are JSDoc comments only—they don't affect runtime behavior. Should be updated for accuracy but are non-blocking.

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

## Implementation Notes

### Analysis Complete - No Breaking Changes Found

After reviewing the codebase, the extension appears **fully compatible** with Flux v2.7+ and v2.8+:

1. **kubectl queries** use kind names, not API versions
2. **flux CLI commands** use stable output formats
3. **flux trace** dynamically passes apiVersion from resources
4. **Type definitions** match the structure of v1 resources

### Only Documentation Updates Needed

The only changes required are:
1. Update README.md to clarify Flux v2.7+ compatibility
2. Update comments in helmRelease.ts to reference v1 instead of v1beta1

### Why This Works

The extension was designed with good abstraction:
- Uses kubectl's automatic API version resolution
- Uses Flux CLI as abstraction layer
- Doesn't hardcode API versions in queries
- Type definitions describe structure, not version

## Dependencies

- Flux CLI v2.7+ recommended for users
- kubectl with cluster access
- Kubernetes cluster running Flux v2.7+