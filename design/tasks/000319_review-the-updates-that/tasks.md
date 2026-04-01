# Implementation Tasks

## Phase 1: Code Analysis (No Cluster Required)

- [~] Analyze `flux check` output parsing for compatibility with Flux v2.7+
- [ ] Analyze `flux tree` command JSON parsing for compatibility
- [ ] Analyze `flux trace` command API version handling
- [ ] Review kubectl queries for resource group/version compatibility
- [ ] Review type definitions for hardcoded API versions
- [ ] Document all findings in design.md

## Phase 2: Code Updates (if needed)

- [ ] Update API version references in type definitions if hardcoded
- [ ] Fix `flux check` parsing if output format changed
- [ ] Fix `flux trace` command if API version handling changed
- [ ] Update kubectl queries if resource group/version changed
- [ ] Update FluxTypes to include any new resource kinds

## Phase 3: Documentation

- [ ] Update README.md with minimum Flux version (v2.7+)
- [ ] Document any known limitations with newer Flux versions
- [ ] Create PR description

## Phase 4: New Feature Support (Optional/Future)

- [ ] Add ExternalArtifact resource type support
- [ ] Add ArtifactGenerator resource type support  
- [ ] Add ImagePolicy, ImageRepository, ImageUpdateAutomation to Sources view
- [ ] Update context menus for new resource types