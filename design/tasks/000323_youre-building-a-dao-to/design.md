# Design: VS Code GitOps Tools Extension DAO Maintainer

## Architecture Overview

The DAO operates as a GitHub App with event-driven automation. It monitors repository events and executes maintenance tasks through GitHub Actions workflows.

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│  weaveworks/vscode-gitops-tools (or fork)                   │
└─────────────────┬───────────────────────────────────────────┘
                  │ Webhooks
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   DAO Controller                             │
│  (GitHub App / Actions Workflows)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Release    │  │  Issue      │  │  PR Review          │  │
│  │  Manager    │  │  Triager    │  │  Bot                │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Dependency │  │  Stale      │  │  CHANGELOG          │  │
│  │  Updater    │  │  Cleaner    │  │  Generator          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Release Manager

Extends existing `build-vsix.yml` workflow with autonomous triggering.

**Decision Logic:**
- Count commits since last tag
- Check if CI passes on `main`/`edge`
- Evaluate time since last release
- Trigger `workflow_dispatch` when criteria met

**Release Criteria (Stable):**
- 5+ merged PRs since last release, OR
- 14+ days since last release with any changes, OR
- Critical bug fix merged (labeled `priority:critical`)

### 2. Issue Triager

Runs on `issues.opened` and `issues.edited` events.

**Triage Rules:**
| Condition | Action |
|-----------|--------|
| Missing required fields in bug template | Add `needs-info` label, comment requesting details |
| Contains stack trace + repro steps | Add `bug`, `triaged` labels |
| Keywords: "crash", "error", "broken" | Add `bug` label |
| Keywords: "feature", "would be nice", "request" | Add `enhancement` label |
| Mentions specific Flux version mismatch | Add `compatibility` label |

### 3. PR Review Bot

Automated checks beyond CI:

- **Scope Check:** Flags PRs touching >10 files for manual review
- **Test Coverage:** Ensures changes to `src/` include test updates
- **Webview Sync:** If `webview-ui/` changes, verify `npm run build:webview` succeeds
- **Merge Strategy:** Comments reminder about squash-merge (except `release-pr`)

### 4. Dependency Updater

Weekly scheduled workflow:

- Run `npm audit` and create issues for vulnerabilities
- Check for minor/patch updates to dependencies
- Create grouped PRs for non-breaking updates
- Verify VS Code engine compatibility before merging

### 5. Stale Issue Manager

Uses GitHub's stale action with custom config:

```yaml
daysBeforeStale: 30
daysBeforeClose: 60
exemptLabels: ['pinned', 'priority:critical', 'in-progress']
staleLabel: 'stale'
```

## Data Flow

### Release Flow
```
main branch updated
       │
       ▼
CI passes? ───No──► Wait
       │
      Yes
       │
       ▼
Release criteria met? ───No──► Wait
       │
      Yes
       │
       ▼
Trigger build-vsix.yml (workflow_dispatch)
       │
       ▼
Publish to marketplaces
       │
       ▼
Create release-pr
       │
       ▼
Auto-merge release-pr (merge commit, not squash)
```

### Issue Flow
```
Issue opened
       │
       ▼
Parse template fields
       │
       ▼
Bug report? ─────────────────► Feature request?
       │                              │
       ▼                              ▼
Validate required info         Check for duplicates
       │                              │
       ▼                              ▼
Apply labels                   Apply 'enhancement' label
       │                              │
       └──────────────┬───────────────┘
                      │
                      ▼
               Add to project board
```

## Key Decisions

### Why GitHub Actions (not external service)?
- Zero infrastructure cost
- Native GitHub integration
- Existing workflow (`build-vsix.yml`) already proven
- Secrets management built-in (VSC_MKTP_PAT, OPEN_VSX_TOKEN)

### Why not full AI code generation?
- Extension has complex Kubernetes/Flux integration
- Bug fixes require domain expertise
- DAO focuses on *process automation*, not code authoring
- Human contributors still write code; DAO manages the lifecycle

### Governance Model
- **Routine tasks:** Fully autonomous (releases, triage, stale cleanup)
- **Code changes:** Require human PR approval
- **Breaking changes:** Flag for maintainer review, never auto-merge

## Configuration

All DAO behavior controlled via `.github/dao-config.yml`:

```yaml
release:
  stable_threshold_prs: 5
  stable_threshold_days: 14
  auto_merge_release_pr: true

triage:
  auto_label: true
  request_missing_info: true

stale:
  days_before_stale: 30
  days_before_close: 60

dependencies:
  auto_update_patch: true
  auto_update_minor: false
  security_alerts: true
```

## Security Considerations

- DAO never writes code directly to `main` or `edge`
- All changes go through PRs
- Existing branch protection rules remain enforced
- Secrets stored in GitHub encrypted secrets
- Actions pinned to commit SHAs (already done in `build-vsix.yml`)