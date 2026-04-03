# Implementation Tasks

## Phase 1: Repository Setup

- [x] Fork `weaveworks/vscode-gitops-tools` to DAO-controlled fork
- [x] Update README documenting the DAO co-maintainer model
- [x] Add "Community Fork" notice explaining relationship to upstream
- [x] Document that DAO exercises judgment and works in public
- [ ] Configure branch protection on `main` and `edge`

## Phase 2: Core Infrastructure

- [x] Create `.github/dao-config.yml` with DAO identity and settings
- [x] Define collaborators and their roles (co-maintainer, not approver)
- [~] Create GitHub App or bot account for DAO actions
- [~] Add `DAO_GITHUB_TOKEN` secret with repo/workflow permissions
- [~] Set up GitHub Actions workflow permissions

## Phase 3: Audit System

- [x] Create `.github/workflows/dao-audit.yml`
- [x] Implement `npm audit` check with severity thresholds
- [x] Generate dependency diff (added, removed, updated packages)
- [x] Detect changes to sensitive areas:
  - [x] Telemetry code (`src/telemetry.ts`)
  - [x] Network calls (grep for `fetch`, `http`, `request`)
  - [x] File system access
  - [x] VS Code permissions in `package.json`
- [x] Generate human-readable audit report
- [x] Publish audit report as release artifact (public)
- [x] Include DAO confidence level and release rationale

## Phase 4: Release Automation (Autonomous)

- [x] Create `.github/workflows/dao-release.yml`
- [x] Implement release criteria evaluation:
  - [x] Count PRs merged since last tag
  - [x] Check days since last release
  - [x] Verify CI passes
  - [x] Verify audit passes (no high/critical vulnerabilities)
- [x] DAO makes release decision autonomously (no human approval step)
- [x] Build `.vsix` artifact from clean checkout
- [x] Generate CHANGELOG from squash-merged PR titles
- [x] Publish GitHub Release with:
  - [x] `.vsix` artifact
  - [x] Audit report
  - [x] Release rationale ("Why I shipped this")
  - [x] Manual install instructions
- [ ] Test stable release flow end-to-end
- [ ] Test edge release flow end-to-end

## Phase 5: Upstream Sync

- [x] Create `.github/workflows/dao-upstream-sync.yml` (scheduled weekly)
- [x] Monitor `weaveworks/vscode-gitops-tools` for new commits
- [x] Create PR to merge upstream changes
- [x] Run full audit on upstream code (treat as untrusted)
- [x] Flag sensitive upstream changes in PR description
- [x] DAO evaluates and merges when confident (no human approval required)
- [x] Document divergence from upstream

## Phase 6: Issue Triage

- [x] Create `.github/workflows/dao-issue-triage.yml`
- [x] Trigger on `issues.opened` and `issues.edited`
- [x] Parse bug report template fields
- [x] Auto-apply appropriate labels (`bug`, `enhancement`, severity)
- [x] Request missing information when template incomplete
- [x] Check for duplicate issues
- [x] Comment explaining triage decisions (work in public)

## Phase 7: PR Review

- [x] Create `.github/workflows/dao-pr-review.yml`
- [x] Run full CI and audit on PRs
- [x] Check for suspicious patterns
- [x] Flag large PRs (>10 files) for careful review
- [x] Verify `webview-ui/` changes build successfully
- [x] Comment with review summary (public)
- [x] Merge when confident, not when told to

## Phase 8: Dependency Management

- [x] Create `.github/workflows/dao-dependency-check.yml` (weekly cron)
- [x] Run `npm audit` and create issues for vulnerabilities
- [x] Create PRs for dependency updates
- [x] Include audit summary in PR description
- [x] Verify VS Code engine compatibility (`^1.63.0`)
- [x] DAO merges safe updates autonomously

## Phase 9: Stale Issue Cleanup

- [x] Create `.github/workflows/dao-stale.yml`
- [x] Configure 30-day stale warning
- [x] Configure 60-day auto-close
- [x] Exempt `pinned`, `security`, `in-progress` labels
- [x] Add friendly close message explaining why
- [x] Provide instructions for reopening

## Phase 10: Documentation & Transparency

- [x] Create `.github/DAO.md` explaining:
  - [x] What the DAO is
  - [x] How it exercises judgment
  - [x] How it works in public
  - [x] The co-maintainer relationship
  - [x] That this is open source, not a business
- [x] Document audit process and what it checks
- [x] Write user guide for manual `.vsix` installation
- [ ] Keep CHANGELOG, README, CONTRIBUTING current

## Phase 11: Monitoring

- [ ] Create monthly summary issue of DAO actions
- [x] Log all decisions with rationale (public)
- [ ] Track release metrics (time to release, audit pass rate)
- [ ] Track upstream sync status

## Future: Marketplace Publishing (When/If Ready)

- [ ] Human collaborator provides publisher identity (favor, not requirement)
- [ ] Human trusts DAO's judgment about what to publish
- [ ] DAO continues making all release decisions
- [ ] Human provides identity, DAO provides releases

## Future: Weaveworks Transfer (If Offered)

- [ ] Coordinate with original maintainer (Kingdon Barrett)
- [ ] Accept transfer of repo to DAO-controlled org
- [ ] Update package.json publisher if marketplace entry transferred
- [ ] Announce transition in release notes
- [ ] Continue operating autonomously