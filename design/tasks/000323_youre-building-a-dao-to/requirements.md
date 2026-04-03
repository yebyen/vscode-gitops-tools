# Requirements: VS Code GitOps Tools Extension DAO Maintainer

## Overview

An autonomous DAO (Decentralized Autonomous Organization) system to maintain the VS Code GitOps Tools extension (Flux). The DAO handles the mechanical work of maintenance: CI, triage, changelog generation, and preparing releases. A **human sponsor** holds accountability for marketplace publishing, liability, and final release approval.

**Key Constraint:** Microsoft's VS Code Marketplace requires a verified human or organization to publish. The DAO automates the *work*, but a human remains the legal publisher and assumes liability.

## User Stories

### Human Sponsor Relationship

**US-0: Human Sponsor Accountability**
As the human sponsor, I hold the legal identity for marketplace publishing and approve all releases before public distribution.

**Acceptance Criteria:**
- [ ] Sponsor signs VS Code Marketplace publisher agreement (when ready for Phase 2)
- [ ] Sponsor holds all marketplace credentials (VSC_MKTP_PAT, OPEN_VSX_TOKEN)
- [ ] Sponsor receives notification when release is ready for review
- [ ] Sponsor can veto any release by declining to publish
- [ ] Sponsor can pause all automation if something looks wrong

**US-0a: Release Approval Workflow**
As the human sponsor, I review audit reports and test builds before approving publication.

**Acceptance Criteria:**
- [ ] DAO prepares draft release with .vsix artifact
- [ ] DAO generates audit report (dependencies, code changes, permissions)
- [ ] Sponsor reviews report and downloads .vsix for local testing
- [ ] Sponsor publishes GitHub Release (Phase 1) or triggers marketplace publish (Phase 2)
- [ ] No release goes public without explicit sponsor action

### Release Preparation

**US-1: GitHub Release Preparation**
As the DAO, I prepare releases with built artifacts and audit reports for sponsor approval.

**Acceptance Criteria:**
- [ ] Detect when `main` has unreleased changes ready for release
- [ ] Run CI tests before preparing any release
- [ ] Bump version in `package.json` using semver
- [ ] Generate CHANGELOG from squash-merged PR titles
- [ ] Build .vsix artifact
- [ ] Generate audit report (dependencies, code diff, permissions)
- [ ] Create DRAFT GitHub Release with artifacts attached
- [ ] Notify sponsor that release is ready for review

**US-2: Edge/Pre-release Preparation**
As the DAO, I prepare edge releases from `edge` branch for experimental features.

**Acceptance Criteria:**
- [ ] Track `edge` branch for prerelease candidates
- [ ] Use prerelease version format (e.g., `0.28.0-edge.1`)
- [ ] Skip CHANGELOG generation for edge releases
- [ ] Mark as pre-release in GitHub Release draft

### Code Auditing

**US-3: Dependency Audit**
As the DAO, I audit all dependencies for security issues and unexpected changes.

**Acceptance Criteria:**
- [ ] Run `npm audit` and flag high/critical vulnerabilities
- [ ] Detect added, removed, or updated dependencies
- [ ] Check for known malicious packages
- [ ] Include dependency diff in audit report

**US-4: Code Change Audit**
As the DAO, I flag sensitive code changes for sponsor attention.

**Acceptance Criteria:**
- [ ] Detect changes to telemetry code
- [ ] Detect new network calls or endpoints
- [ ] Detect file system access changes
- [ ] Detect new VS Code permissions requested
- [ ] Summarize all changes in human-readable format

**US-5: Upstream Reconciliation**
As the DAO, I track divergence from the original Weaveworks repository.

**Acceptance Criteria:**
- [ ] Monitor `weaveworks/vscode-gitops-tools` for new commits
- [ ] Create PR to merge upstream changes
- [ ] Generate audit report for upstream code (treat as untrusted)
- [ ] Flag upstream changes to sensitive areas
- [ ] Document which upstream commits are included/excluded

### Issue Triage

**US-6: Bug Report Handling**
As the DAO, I triage incoming bug reports and assign appropriate labels.

**Acceptance Criteria:**
- [ ] Parse bug reports using existing template fields
- [ ] Validate version info (kubectl, flux, extension, VS Code, OS)
- [ ] Assign labels: `bug`, severity (`critical`, `high`, `medium`, `low`)
- [ ] Request missing information if template incomplete
- [ ] Escalate security-related bugs to sponsor immediately

**US-7: Feature Requests**
As the DAO, I label and deduplicate feature requests.

**Acceptance Criteria:**
- [ ] Label with `enhancement`
- [ ] Check for duplicates
- [ ] Track upvotes/reactions for prioritization

### Code Quality

**US-8: PR Review Assistance**
As the DAO, I run automated checks and flag issues for human reviewers.

**Acceptance Criteria:**
- [ ] Verify PR passes CI (`npm run lint`, `npm test`)
- [ ] Flag large PRs (>10 files) for careful review
- [ ] Check for breaking changes
- [ ] Ensure squash-merge strategy is used (except `release-pr`)
- [ ] Validate webview builds if `webview-ui/` modified

**US-9: Dependency Updates**
As the DAO, I create PRs for dependency updates after auditing them.

**Acceptance Criteria:**
- [ ] Monitor for security vulnerabilities
- [ ] Create PRs for dependency updates with audit summary
- [ ] Verify compatibility with VS Code engine version (`^1.63.0`)
- [ ] Group non-breaking updates into single PR

### Community Management

**US-10: Stale Issue Cleanup**
As the DAO, I manage stale issues and PRs.

**Acceptance Criteria:**
- [ ] Mark issues inactive after 30 days without response
- [ ] Close issues after 60 days of inactivity with no reproduction
- [ ] Notify contributors before closing
- [ ] Exempt security issues from auto-close

## Non-Functional Requirements

- **Human Accountability:** All published releases require human sponsor approval
- **Transparency:** Log all decisions with rationale in issue/PR comments
- **Safety:** Never publish to marketplace autonomously; prepare only
- **Auditability:** Every release includes audit report of dependencies and code changes
- **Reversibility:** All automated changes can be reverted
- **Upstream Skepticism:** Treat upstream code as untrusted; audit it too
- **Provenance:** Maintain clear lineage back to original Weaveworks project

## Release Phases

### Phase 1: GitHub Releases Only
- DAO prepares .vsix artifacts and audit reports
- Sponsor reviews, tests, and publishes GitHub Releases
- Users install manually via `code --install-extension`
- Builds trust before marketplace exposure

### Phase 2: Marketplace Publication
- Sponsor registers as marketplace publisher
- Sponsor holds credentials, triggers publish after approval
- DAO prepares releases, sponsor clicks publish
- Sponsor remains legally accountable

### Phase 3: Weaveworks Entry (If Transferred)
- Original maintainer transfers repo and/or credentials
- Sponsor accepts transfer of liability
- Higher scrutiny required (25k+ existing users)