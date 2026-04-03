# Implementation Tasks

## Phase 1: Core Infrastructure

- [ ] Create `.github/dao-config.yml` configuration file with default settings
- [ ] Create GitHub App registration (or use existing bot account with PAT)
- [ ] Add `DAO_GITHUB_TOKEN` secret with repo/workflow permissions

## Phase 2: Release Automation

- [ ] Create `.github/workflows/dao-release-scheduler.yml` (cron job to check release criteria)
- [ ] Add logic to count PRs merged since last tag
- [ ] Add logic to check days since last release
- [ ] Implement `workflow_dispatch` trigger to existing `build-vsix.yml`
- [ ] Add auto-merge for `release-pr` branch (merge commit, not squash)
- [ ] Test stable release flow end-to-end
- [ ] Test edge release flow end-to-end

## Phase 3: Issue Triage

- [ ] Create `.github/workflows/dao-issue-triage.yml` (triggers on `issues.opened`, `issues.edited`)
- [ ] Parse bug report template fields (Expected, Actual, Steps, Versions)
- [ ] Add `needs-info` label and comment when required fields missing
- [ ] Auto-apply `bug` label for bug reports
- [ ] Auto-apply `enhancement` label for feature requests
- [ ] Check for duplicate issues using title similarity
- [ ] Add severity labels based on keywords (crash, error, data loss)

## Phase 4: PR Review Bot

- [ ] Create `.github/workflows/dao-pr-review.yml` (triggers on `pull_request`)
- [ ] Flag large PRs (>10 files) for manual review
- [ ] Check that `src/` changes include test file changes
- [ ] Verify `webview-ui/` changes build successfully
- [ ] Comment reminder about squash-merge (except for `release-pr`)
- [ ] Auto-approve Dependabot patch updates after CI passes

## Phase 5: Dependency Management

- [ ] Create `.github/workflows/dao-dependency-check.yml` (weekly cron)
- [ ] Run `npm audit` and create issues for vulnerabilities
- [ ] Group minor/patch dependency updates into single PR
- [ ] Verify VS Code engine compatibility (`^1.63.0`)
- [ ] Enable Dependabot alerts if not already enabled

## Phase 6: Stale Issue Cleanup

- [ ] Create `.github/workflows/dao-stale.yml` using `actions/stale`
- [ ] Configure 30-day stale warning
- [ ] Configure 60-day auto-close
- [ ] Exempt `pinned`, `priority:critical`, `in-progress` labels
- [ ] Add friendly close message with reopen instructions

## Phase 7: Documentation & Governance

- [ ] Document DAO behavior in `CONTRIBUTING.md`
- [ ] Create `.github/DAO.md` explaining autonomous actions
- [ ] Add opt-out labels (`no-auto-close`, `manual-review-required`)
- [ ] Set up GitHub Project board for automated issue tracking

## Phase 8: Monitoring & Observability

- [ ] Add workflow run summaries to a `#dao-activity` channel (optional)
- [ ] Create monthly report issue summarizing DAO actions
- [ ] Log all auto-close/auto-label decisions with rationale in comments
- [ ] Track release cadence metrics