# Implementation Tasks

## Phase 1: Repository Setup

- [~] Fork `weaveworks/vscode-gitops-tools` to DAO-controlled fork
- [~] Update README documenting the DAO co-maintainer model
- [~] Add "Community Fork" notice explaining relationship to upstream
- [~] Document that DAO exercises judgment and works in public
- [ ] Configure branch protection on `main` and `edge`

## Phase 2: Core Infrastructure

- [ ] Create `.github/dao-config.yml` with DAO identity and settings
- [ ] Define collaborators and their roles (co-maintainer, not approver)
- [ ] Create GitHub App or bot account for DAO actions
- [ ] Add `DAO_GITHUB_TOKEN` secret with repo/workflow permissions
- [ ] Set up GitHub Actions workflow permissions

## Phase 3: Audit System

- [ ] Create `.github/workflows/dao-audit.yml`
- [ ] Implement `npm audit` check with severity thresholds
- [ ] Generate dependency diff (added, removed, updated packages)
- [ ] Detect changes to sensitive areas:
  - [ ] Telemetry code (`src/telemetry.ts`)
  - [ ] Network calls (grep for `fetch`, `http`, `request`)
  - [ ] File system access
  - [ ] VS Code permissions in `package.json`
- [ ] Generate human-readable audit report
- [ ] Publish audit report as release artifact (public)
- [ ] Include DAO confidence level and release rationale

## Phase 4: Release Automation (Autonomous)

- [ ] Create `.github/workflows/dao-release.yml`
- [ ] Implement release criteria evaluation:
  - [ ] Count PRs merged since last tag
  - [ ] Check days since last release
  - [ ] Verify CI passes
  - [ ] Verify audit passes (no high/critical vulnerabilities)
- [ ] DAO makes release decision autonomously (no human approval step)
- [ ] Build `.vsix` artifact from clean checkout
- [ ] Generate CHANGELOG from squash-merged PR titles
- [ ] Publish GitHub Release with:
  - [ ] `.vsix` artifact
  - [ ] Audit report
  - [ ] Release rationale ("Why I shipped this")
  - [ ] Manual install instructions
- [ ] Test stable release flow end-to-end
- [ ] Test edge release flow end-to-end

## Phase 5: Upstream Sync

- [ ] Create `.github/workflows/dao-upstream-sync.yml` (scheduled weekly)
- [ ] Monitor `weaveworks/vscode-gitops-tools` for new commits
- [ ] Create PR to merge upstream changes
- [ ] Run full audit on upstream code (treat as untrusted)
- [ ] Flag sensitive upstream changes in PR description
- [ ] DAO evaluates and merges when confident (no human approval required)
- [ ] Document divergence from upstream

## Phase 6: Issue Triage

- [ ] Create `.github/workflows/dao-issue-triage.yml`
- [ ] Trigger on `issues.opened` and `issues.edited`
- [ ] Parse bug report template fields
- [ ] Auto-apply appropriate labels (`bug`, `enhancement`, severity)
- [ ] Request missing information when template incomplete
- [ ] Check for duplicate issues
- [ ] Comment explaining triage decisions (work in public)

## Phase 7: PR Review

- [ ] Create `.github/workflows/dao-pr-review.yml`
- [ ] Run full CI and audit on PRs
- [ ] Check for suspicious patterns
- [ ] Flag large PRs (>10 files) for careful review
- [ ] Verify `webview-ui/` changes build successfully
- [ ] Comment with review summary (public)
- [ ] Merge when confident, not when told to

## Phase 8: Dependency Management

- [ ] Create `.github/workflows/dao-dependency-check.yml` (weekly cron)
- [ ] Run `npm audit` and create issues for vulnerabilities
- [ ] Create PRs for dependency updates
- [ ] Include audit summary in PR description
- [ ] Verify VS Code engine compatibility (`^1.63.0`)
- [ ] DAO merges safe updates autonomously

## Phase 9: Stale Issue Cleanup

- [ ] Create `.github/workflows/dao-stale.yml`
- [ ] Configure 30-day stale warning
- [ ] Configure 60-day auto-close
- [ ] Exempt `pinned`, `security`, `in-progress` labels
- [ ] Add friendly close message explaining why
- [ ] Provide instructions for reopening

## Phase 10: Documentation & Transparency

- [ ] Create `.github/DAO.md` explaining:
  - [ ] What the DAO is
  - [ ] How it exercises judgment
  - [ ] How it works in public
  - [ ] The co-maintainer relationship
  - [ ] That this is open source, not a business
- [ ] Document audit process and what it checks
- [ ] Write user guide for manual `.vsix` installation
- [ ] Keep CHANGELOG, README, CONTRIBUTING current

## Phase 11: Monitoring

- [ ] Create monthly summary issue of DAO actions
- [ ] Log all decisions with rationale (public)
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