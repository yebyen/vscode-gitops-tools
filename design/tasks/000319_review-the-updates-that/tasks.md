# Implementation Tasks

## Phase 1: Code Analysis (No Cluster Required)

- [x] Analyze `flux check` output parsing for compatibility with Flux v2.7+
- [x] Analyze `flux tree` command JSON parsing for compatibility
- [x] Analyze `flux trace` command API version handling
- [x] Review kubectl queries for resource group/version compatibility
- [x] Review type definitions for hardcoded API versions
- [x] Document all findings in design.md

## Phase 2: Code Updates (if needed)

- [x] ~~Update API version references in type definitions if hardcoded~~ Not needed - queries use kind names
- [x] ~~Fix `flux check` parsing if output format changed~~ Not needed - format unchanged
- [x] ~~Fix `flux trace` command if API version handling changed~~ Not needed - uses dynamic apiVersion
- [x] ~~Update kubectl queries if resource group/version changed~~ Not needed - uses kind names
- [x] Update comments in helmRelease.ts to reference v1 instead of v1beta1

## Phase 3: Documentation

- [x] Update README.md with minimum Flux version (v2.7+)
- [x] Document any known limitations with newer Flux versions
- [x] Create PR description

## Phase 4: CI/CD Updates for Flux 2.8 Testing

- [~] Update CI workflow to use Flux 2.8.x explicitly
- [ ] Run CI tests against Flux 2.8 to verify compatibility
- [ ] Document test results in design.md

## Phase 5: New Feature Support (Optional/Future)

- [ ] Add ExternalArtifact resource type support
- [ ] Add ArtifactGenerator resource type support  
- [ ] Add ImagePolicy, ImageRepository, ImageUpdateAutomation to Sources view
- [ ] Update context menus for new resource types