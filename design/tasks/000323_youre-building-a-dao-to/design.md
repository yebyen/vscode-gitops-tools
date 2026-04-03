# Design: VS Code GitOps Tools Extension DAO Maintainer

## Architecture Overview

The DAO operates as a GitHub App with event-driven automation. It monitors repository events and executes maintenance tasks through GitHub Actions workflows.

**Key Context:** The original maintainer (Kingdon Barrett, formerly Weaveworks) remains available to coordinate transfer of the original repository and marketplace entry. The DAO starts with its own marketplace presence, proving its value before potentially inheriting the established `weaveworks.vscode-gitops-tools` entry with 25,000+ downloads.

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│  Phase 1: fork (yebyen/vscode-gitops-tools)                 │
│  Phase 2: transferred (gitops-dao/vscode-gitops-tools)      │
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
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Marketplace Publishing                      │
│  Phase 1: gitops-dao.vscode-gitops-tools (new entry)        │
│  Phase 2: weaveworks.vscode-gitops-tools (inherited)        │
└─────────────────────────────────────────────────────────────┘
```

## Marketplace Transition Strategy

### Phase 1: Independent Publisher (Proof of Value)

The DAO publishes under its own identity to build credibility:

| Asset | Value |
|-------|-------|
| **Publisher ID** | `gitops-dao` (or `ghost-of-weaveworks`) |
| **Extension ID** | `gitops-dao.vscode-gitops-tools` |
| **Repository** | Fork: `yebyen/vscode-gitops-tools` |

**Why start fresh?**
- Demonstrates DAO can ship quality releases autonomously
- Protects existing 25k users from unproven automation
- Builds track record that justifies transfer

### Phase 2: Stewardship Transfer (Public Ceremony)

When the DAO proves itself, the original maintainer transfers ownership:

```
Transition Criteria (all must be met):
├── 3+ successful stable releases shipped by DAO
├── 500+ downloads on DAO marketplace entry
├── <5 unresolved critical bugs
├── Original maintainer public approval
└── Community sentiment positive (GitHub reactions, issues)
```

**Transfer Ceremony:**
1. Original maintainer transfers GitHub repo to DAO org
2. Marketplace publisher credentials rotated to DAO secrets
3. Joint announcement in release notes
4. Redirect notice added to DAO's temporary marketplace entry

### Phase 3: Legacy Steward

Post-transfer, the DAO maintains the original entry:

| Asset | Value |
|-------|-------|
| **Publisher ID** | `weaveworks` (inherited) |
| **Extension ID** | `weaveworks.vscode-gitops-tools` (preserved) |
| **Repository** | Transferred to DAO org |
| **Download Count** | Preserved (25,000+) |

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

**Publisher Selection:**
```yaml
# In workflow, select publisher based on phase
publisher: ${{ secrets.MARKETPLACE_PUBLISHER }}  # 'gitops-dao' → 'weaveworks'
```

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
Publish to marketplaces (using current publisher identity)
       │
       ▼
Create release-pr
       │
       ▼
Auto-merge release-pr (merge commit, not squash)
```

### Stewardship Transfer Flow
```
DAO releases 3+ stable versions
       │
       ▼
Downloads exceed 500? ───No──► Continue releasing
       │
      Yes
       │
       ▼
Original maintainer approves? ───No──► Continue building trust
       │
      Yes
       │
       ▼
Public ceremony: repo transfer
       │
       ▼
Rotate marketplace credentials
       │
       ▼
Update package.json publisher to 'weaveworks'
       │
       ▼
Ship first release under inherited identity
       │
       ▼
Deprecate temporary DAO marketplace entry
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

### Why start with a separate marketplace entry?
- De-risks the transition for existing 25k users
- Proves DAO capability before inheriting trust
- Allows rollback if automation fails
- Original maintainer retains control until confident

### Why not full AI code generation?
- Extension has complex Kubernetes/Flux integration
- Bug fixes require domain expertise
- DAO focuses on *process automation*, not code authoring
- Human contributors still write code; DAO manages the lifecycle

### Governance Model
- **Routine tasks:** Fully autonomous (releases, triage, stale cleanup)
- **Code changes:** Require human PR approval
- **Breaking changes:** Flag for maintainer review, never auto-merge
- **Stewardship transfer:** Requires original maintainer blessing

## Configuration

All DAO behavior controlled via `.github/dao-config.yml`:

```yaml
marketplace:
  publisher: gitops-dao  # Changes to 'weaveworks' after transfer
  phase: 1  # 1 = independent, 2 = transferred
  
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

transition:
  required_releases: 3
  required_downloads: 500
  original_maintainer: kingdonb
```

## Security Considerations

- DAO never writes code directly to `main` or `edge`
- All changes go through PRs
- Existing branch protection rules remain enforced
- Secrets stored in GitHub encrypted secrets
- Actions pinned to commit SHAs (already done in `build-vsix.yml`)
- Marketplace credentials scoped to minimum required permissions
- Transfer ceremony documented publicly for accountability