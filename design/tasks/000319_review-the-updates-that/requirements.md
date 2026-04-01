# Requirements: Flux Compatibility Review for vscode-gitops-tools

## Overview

Review Flux release notes from v2.0 to v2.8.3 to understand what changes need to be made to bring the vscode-gitops-tools extension up to date with current Flux.

## User Stories

### US1: Extension Works with Current Flux
As a developer using Flux v2.7+, I want the GitOps Tools extension to correctly interact with my Flux installation so that I can manage my GitOps workflows.

### US2: API Compatibility
As a developer, I want the extension to use the correct API versions (v1) for Flux resources so that resource operations succeed without deprecation warnings.

### US3: New Feature Support
As a developer, I want the extension to support new Flux resource types (e.g., OCIRepository, ExternalArtifact) so I have full visibility into my GitOps setup.

## Acceptance Criteria

1. **API Version Updates**
   - [ ] Extension uses `v1` API versions instead of deprecated `v1beta1/v2beta1/v2beta2`
   - [ ] All kubectl commands reference correct API groups

2. **Resource Type Support**
   - [ ] OCIRepository sources fully supported
   - [ ] New Flux v2.7+ resource types identified and documented

3. **CLI Compatibility**
   - [ ] Extension works with Flux CLI v2.7+ output formats
   - [ ] `flux check` parsing handles current output format
   - [ ] `flux tree` and `flux trace` commands work correctly

4. **Documentation**
   - [ ] Gap analysis document produced listing all breaking changes
   - [ ] Required code changes identified and prioritized

## Context

- **Repository last updated**: January 2024 (v0.27.0)
- **Extension rolled back** to pre-0.25.x codebase due to issue #503
- **Current Flux version**: v2.8.3 (March 2026)
- **Key breaking changes in Flux**:
  - v2.7.0: Removed `v1beta1` and `v2beta1` APIs (deprecated 2023)
  - v2.8.0: Removed `v1beta2` and `v2beta2` APIs (deprecated 2024)
  - New features: Image Automation APIs GA, ExternalArtifact, ArtifactGenerator