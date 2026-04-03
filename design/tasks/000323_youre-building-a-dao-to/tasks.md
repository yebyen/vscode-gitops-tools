# Implementation Tasks

## Phase 0: Repository Setup

- [ ] Fork `weaveworks/vscode-gitops-tools` to `yebyen/vscode-gitops-tools`
- [ ] Update README to document relationship to original Weaveworks extension
- [ ] Add "Community Fork" notice explaining the DAO maintenance model
- [ ] Document human sponsor role and accountability in CONTRIBUTING.md
- [ ] Configure branch protection rules on `main` and `edge`

## Phase 1: Core Infrastructure

- [ ] Create `.github/dao-config.yml` configuration file with default settings
- [ ] Define `sponsor.github_username` for notification routing
- [ ] Create GitHub App registration (or use bot account with PAT)
- [ ] Add `DAO_GITHUB_TOKEN` secret with repo permissions
- [ ] Set up GitHub Actions workflow permissions (read/write)

## Phase 2: Audit System

- [ ] Create `.github/workflows/dao-audit.yml` (runs on PR and release prep)
- [ ] Implement `npm audit` check with severity thresholds
- [ ] Generate dependency diff (added, removed, updated packages)
- [ ] Detect changes to telemetry code paths (`src/telemetry.ts`)
- [ ] Detect new network calls (grep for `fetch`, `http`, `request`)
- [ ] Detect file system access changes
- [ ] Detect new VS Code permissions in `package.json` contributes
- [ ] Generate human-readable audit report as PR comment or release artifact
- [ ] Implement build reproducibility check (hash comparison)

## Phase 3: Release Preparation (GitHub Only)

- [ ] Create `.github/workflows/dao-release-prepare.yml`
- [ ] Add logic to count PRs merged since last tag
- [ ] Add logic to check days since last release
- [ ] Build `.vsix` artifact from clean checkout
- [ ] Generate CHANGELOG from squash-merged PR titles
- [ ] Run full audit and include report as release artifact
- [ ] Create DRAFT GitHub Release (not published)
- [ ] Notify sponsor via GitHub mention or issue comment
- [ ] Document manual install instructions in release notes

## Phase 4: Sponsor Notification

- [ ] Create `.github/workflows/dao-notify-sponsor.yml`
- [ ] Notify sponsor when release draft is ready for review
- [ ] Notify sponsor on security issues (label: `security`)
- [ ] Notify sponsor on audit failures (high/critical vulnerabilities)
- [ ] Include direct links to audit report and .vsix download
- [ ] Provide checklist for sponsor review in notification

## Phase 5: Issue Triage

- [ ] Create `.github/workflows/dao-issue-triage.yml` (triggers on `issues.opened`, `issues.edited`)
- [ ] Parse bug report template fields (Expected, Actual, Steps, Versions)
- [ ] Add `needs-info` label and comment when required fields missing
- [ ] Auto-apply `bug` label for bug reports
- [ ] Auto-apply `enhancement` label for feature requests
- [ ] Check for duplicate issues using title similarity
- [ ] Add severity labels based on keywords (crash, error, data loss)
- [ ] Escalate security-related issues to sponsor immediately

## Phase 6: PR Review Bot

- [ ] Create `.github/workflows/dao-pr-review.yml` (triggers on `pull_request`)
- [ ] Run audit report on PR changes
- [ ] Flag large PRs (>10 files) for careful review
- [ ] Check that `src/` changes include test file changes
- [ ] Verify `webview-ui/` changes build successfully
- [ ] Comment reminder about squash-merge (except for `release-pr`)
- [ ] Summarize code changes in human-readable format

## Phase 7: Upstream Reconciliation

- [ ] Create `.github/workflows/dao-upstream-sync.yml` (scheduled weekly)
- [ ] Monitor `weaveworks/vscode-gitops-tools` for new commits
- [ ] Create PR to merge upstream changes when detected
- [ ] Run full audit on upstream code (treat as untrusted)
- [ ] Flag upstream changes to sensitive areas in PR description
- [ ] Document divergence from upstream in PR
- [ ] Require sponsor approval before merging upstream

## Phase 8: Dependency Management

- [ ] Create `.github/workflows/dao-dependency-check.yml` (weekly cron)
- [ ] Run `npm audit` and create issues for vulnerabilities
- [ ] Group minor/patch dependency updates into single PR
- [ ] Include audit report in dependency update PRs
- [ ] Verify VS Code engine compatibility (`^1.63.0`)
- [ ] Auto-approve only after sponsor reviews audit summary

## Phase 9: Stale Issue Cleanup

- [ ] Create `.github/workflows/dao-stale.yml` using `actions/stale`
- [ ] Configure 30-day stale warning
- [ ] Configure 60-day auto-close
- [ ] Exempt `pinned`, `security`, `in-progress` labels
- [ ] Add friendly close message with reopen instructions

## Phase 10: Documentation & Governance

- [ ] Create `.github/DAO.md` explaining the DAO model and human sponsor role
- [ ] Document what the DAO does autonomously vs. what requires human approval
- [ ] Add opt-out labels (`no-auto-close`, `manual-review-required`)
- [ ] Document the audit process and what it checks
- [ ] Write user guide for manual .vsix installation (Phase 1)

## Phase 11: Monitoring & Observability

- [ ] Create monthly summary issue of DAO actions
- [ ] Log all auto-label/auto-close decisions with rationale
- [ ] Track release preparation metrics (time to ready, audit pass rate)
- [ ] Track upstream sync status (commits behind, divergence)

## Future: Phase 2 Marketplace (When Sponsor Ready)

- [ ] Sponsor registers as VS Marketplace publisher
- [ ] Sponsor registers as Open VSX publisher  
- [ ] Sponsor adds `VSC_MKTP_PAT` secret (sponsor-controlled)
- [ ] Sponsor adds `OPEN_VSX_TOKEN` secret (sponsor-controlled)
- [ ] Create workflow for sponsor to trigger marketplace publish
- [ ] Update release workflow to support marketplace publish step
- [ ] Sponsor retains ability to publish manually or revoke automation

## Future: Weaveworks Transfer (If Offered)

- [ ] Coordinate with original maintainer for public transfer ceremony
- [ ] Sponsor accepts transfer of credentials and liability
- [ ] Update `package.json` publisher to `weaveworks`
- [ ] Rotate marketplace credentials to sponsor-controlled secrets
- [ ] Ship first release under inherited identity
- [ ] Announce transition in release notes