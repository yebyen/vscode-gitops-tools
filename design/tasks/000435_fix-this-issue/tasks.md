# Implementation Tasks

- [ ] Update `updateStatus()` method in `src/views/nodes/sourceNode.ts` to handle OCI HelmRepositories with no status conditions as healthy
- [ ] Add import for `KubernetesObjectKinds` if not already imported in `sourceNode.ts`
- [ ] Test with OCI HelmRepository (e.g., `oci://registry-1.docker.io/bitnamicharts`) to verify green checkmark displays
- [ ] Test with traditional HelmRepository to verify existing behavior is unchanged
- [ ] Test suspended OCI HelmRepository to verify pause icon still appears