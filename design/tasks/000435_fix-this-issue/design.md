# Design: OCI Helm Repositories Status Display Fix

## Overview

Fix the status icon display for OCI-type HelmRepositories in the GitOps Sources tree view. Currently, OCI HelmRepositories are incorrectly marked as failed because they don't have status conditions.

## Root Cause Analysis

**File:** `vscode-gitops-tools/src/views/nodes/sourceNode.ts`

The `updateStatus()` method checks if `source.status.conditions` has a "Ready" condition with `status: 'True'`. If not found, it defaults to the error icon:

```typescript
updateStatus(source: GitRepository | OCIRepository | HelmRepository | Bucket): void {
  if (this.findReadyOrFirstCondition(source.status.conditions)?.status === 'True') {
    this.setIcon(TreeNodeIcon.Success);
    this.isReconcileFailed = false;
  } else {
    this.setIcon(TreeNodeIcon.Error);  // <-- OCI HelmRepos hit this branch
    this.isReconcileFailed = true;
  }
}
```

**Why OCI HelmRepositories have no status:** Unlike traditional Helm repositories that fetch and cache an index file, OCI registries are accessed on-demand. Flux's source-controller doesn't maintain a status for OCI HelmRepositories since there's no artifact to track.

## Solution

Modify the `updateStatus()` method in `sourceNode.ts` to handle OCI HelmRepositories as a special case:

1. Check if the source is a HelmRepository with `spec.type === 'oci'`
2. If so, and there are no conditions (or conditions are empty), treat it as success
3. If there are conditions with errors, still show the error icon

### Code Change

```typescript
updateStatus(source: GitRepository | OCIRepository | HelmRepository | Bucket): void {
  const condition = this.findReadyOrFirstCondition(source.status?.conditions);
  
  // OCI HelmRepositories don't have status conditions when healthy
  const isOciHelmRepo = source.kind === KubernetesObjectKinds.HelmRepository && 
                        (source as HelmRepository).spec?.type === 'oci';
  
  if (condition?.status === 'True') {
    this.setIcon(TreeNodeIcon.Success);
    this.isReconcileFailed = false;
  } else if (isOciHelmRepo && !condition) {
    // OCI HelmRepository with no conditions = healthy
    this.setIcon(TreeNodeIcon.Success);
    this.isReconcileFailed = false;
  } else {
    this.setIcon(TreeNodeIcon.Error);
    this.isReconcileFailed = true;
  }
}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/views/nodes/sourceNode.ts` | Update `updateStatus()` to handle OCI HelmRepositories |

## Design Decisions

### Why check `spec.type === 'oci'` instead of checking for empty conditions?

Other source types (GitRepository, Bucket, OCIRepository) should still show errors if they have no conditions, as that would indicate a problem. Only OCI HelmRepositories are expected to have no conditions when healthy.

### Why not modify HelmRepositoryNode instead?

The status logic is centralized in `SourceNode.updateStatus()`. Adding a special case there keeps the logic in one place rather than spreading it across subclasses.

## Testing Strategy

1. Deploy an OCI HelmRepository (e.g., `oci://registry-1.docker.io/bitnamicharts`)
2. Verify it shows a green checkmark instead of red X
3. Deploy a traditional HelmRepository and verify it still works correctly
4. Test suspended OCI HelmRepository shows the pause icon as expected