# Implementation Tasks

## Phase 1: Compatibility Testing

- [ ] Set up test environment with Flux v2.8+ cluster
- [ ] Verify extension loads and connects to cluster
- [ ] Test `flux check` output parsing with current Flux CLI
- [ ] Test `flux tree` command JSON parsing
- [ ] Test `flux trace` command with v1 API versions
- [ ] Verify Sources tree view displays GitRepository, HelmRepository, Bucket, OCIRepository
- [ ] Verify Workloads tree view displays Kustomization and HelmRelease
- [ ] Test reconcile, suspend, and resume commands
- [ ] Test delete source and delete workload commands
- [ ] Document any failures or breaking changes found

## Phase 2: Code Updates (if needed)

- [ ] Update API version references in type definitions if hardcoded
- [ ] Fix `flux check` parsing if output format changed
- [ ] Fix `flux trace` command if API version handling changed
- [ ] Update kubectl queries if resource group/version changed
- [ ] Update FluxTypes to include any new resource kinds

## Phase 3: Documentation

- [ ] Update README.md with minimum Flux version (v2.7+)
- [ ] Update CHANGELOG.md with compatibility notes
- [ ] Document any known limitations with newer Flux versions
- [ ] Add migration notes for users on older Flux versions

## Phase 4: New Feature Support (Optional/Future)

- [ ] Add ExternalArtifact resource type support
- [ ] Add ArtifactGenerator resource type support  
- [ ] Add ImagePolicy, ImageRepository, ImageUpdateAutomation to Sources view
- [ ] Update context menus for new resource types