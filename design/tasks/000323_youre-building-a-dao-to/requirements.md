# Requirements: VS Code GitOps Tools Extension DAO Maintainer

## Overview

An autonomous DAO (Decentralized Autonomous Organization) system to maintain the VS Code GitOps Tools extension (Flux). The DAO handles releases, bug fixes, feature requests, and ongoing maintenance without human intervention.

The DAO initially publishes to its own marketplace entry, building credibility and user trust. Upon community validation and coordination with the original Weaveworks maintainer (Kingdon Barrett), the DAO may inherit stewardship of the original marketplace entry with 25,000+ downloads.

## User Stories

### Marketplace Strategy

**US-0: Independent Marketplace Entry**
As the DAO, I publish releases to a new marketplace entry under my own publisher identity, establishing an independent track record.

**Acceptance Criteria:**
- [ ] Register new VS Marketplace publisher (e.g., `gitops-dao` or `ghost-of-weaveworks`)
- [ ] Register corresponding Open VSX publisher
- [ ] Update `package.json` publisher field for DAO releases
- [ ] Maintain compatible extension ID for easy migration
- [ ] Document relationship to original `weaveworks.vscode-gitops-tools` in README

**US-0a: Stewardship Transition**
As the DAO, I can accept transfer of the original Weaveworks marketplace entry when the community and original maintainer agree.

**Acceptance Criteria:**
- [ ] Define success metrics for transition readiness (downloads, issues resolved, releases shipped)
- [ ] Coordinate public ceremony for repo transfer with original maintainer
- [ ] Migrate secrets (VSC_MKTP_PAT) to DAO-controlled credentials
- [ ] Update publisher to original `weaveworks` entry (preserving download count)
- [ ] Announce transition to existing user base via release notes

### Release Management

**US-1: Stable Releases**
As the DAO, I can trigger stable releases from `main` branch with automatic version bumping (major/minor/patch), CHANGELOG generation, and publishing to VS Marketplace and Open VSX.

**Acceptance Criteria:**
- [ ] Detect when `main` has unreleased changes ready for stable release
- [ ] Run CI tests before any release
- [ ] Bump version in `package.json` using semver
- [ ] Generate CHANGELOG from squash-merged PR titles
- [ ] Publish to VS Marketplace and Open VSX (DAO publisher initially)
- [ ] Create GitHub release with artifacts
- [ ] Merge the `release-pr` branch back to `main`

**US-2: Edge/Pre-releases**
As the DAO, I can publish edge releases from `edge` branch for experimental features.

**Acceptance Criteria:**
- [ ] Track `edge` branch for prerelease candidates
- [ ] Use prerelease version format (e.g., `0.28.0-edge.1`)
- [ ] Skip CHANGELOG generation for edge releases
- [ ] Publish with `--pre-release` flag

### Issue Triage

**US-3: Bug Report Handling**
As the DAO, I can triage incoming bug reports, validate reproduction steps, and assign severity labels.

**Acceptance Criteria:**
- [ ] Parse bug reports using existing template fields
- [ ] Validate version info (kubectl, flux, extension, VS Code, OS)
- [ ] Assign labels: `bug`, severity (`critical`, `high`, `medium`, `low`)
- [ ] Request missing information if template incomplete

**US-4: Feature Requests**
As the DAO, I can evaluate feature requests against project scope and community interest.

**Acceptance Criteria:**
- [ ] Label with `enhancement`
- [ ] Check for duplicates
- [ ] Track upvotes/reactions for prioritization

### Code Quality

**US-5: PR Review**
As the DAO, I can review PRs for code quality, test coverage, and contribution guidelines.

**Acceptance Criteria:**
- [ ] Verify PR passes CI (`npm run lint`, `npm test`)
- [ ] Check for breaking changes
- [ ] Ensure squash-merge strategy is used (except `release-pr`)
- [ ] Validate webview builds if `webview-ui/` modified

**US-6: Dependency Management**
As the DAO, I can keep dependencies up-to-date and secure.

**Acceptance Criteria:**
- [ ] Monitor for security vulnerabilities (Dependabot alerts)
- [ ] Create PRs for dependency updates
- [ ] Verify compatibility with VS Code engine version (`^1.63.0`)

### Documentation

**US-7: Documentation Maintenance**
As the DAO, I can keep README, CONTRIBUTING, and CHANGELOG current.

**Acceptance Criteria:**
- [ ] Update CHANGELOG after releases
- [ ] Ensure README reflects current features
- [ ] Keep CONTRIBUTING.md release instructions accurate

### Community Management

**US-8: Stale Issue Cleanup**
As the DAO, I can manage stale issues and PRs.

**Acceptance Criteria:**
- [ ] Mark issues inactive after 30 days without response
- [ ] Close issues after 60 days of inactivity with no reproduction
- [ ] Notify contributors before closing

## Non-Functional Requirements

- **Autonomy:** Operate without human intervention for routine tasks
- **Transparency:** Log all decisions with rationale in issue/PR comments
- **Safety:** Never force-push to protected branches; always use PRs
- **Reversibility:** All automated changes can be reverted
- **Rate Limiting:** Respect GitHub API limits; batch operations when possible
- **Provenance:** Maintain clear lineage back to original Weaveworks project