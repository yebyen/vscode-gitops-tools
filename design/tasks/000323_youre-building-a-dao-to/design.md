# Design: VS Code GitOps Tools Extension DAO Maintainer

## Architecture Overview

The DAO operates as an **automated maintainer process**, not a legal entity. A human sponsor holds accountability for marketplace publishing, liability, and final release approval. The DAO handles the mechanical work: CI, triage, changelog generation, and preparing releases for human sign-off.

**Reality Check:** Microsoft's VS Code Marketplace requires a verified human or organization to publish. The DAO automates the *work* of maintenance, but a human remains the legal publisher until/unless a DAO-friendly legal structure emerges.

```
┌─────────────────────────────────────────────────────────────┐
│                    Human Sponsor                             │
│  (Holds publisher credentials, signs agreements, liable)    │
│  Reviews releases, audits code, approves publication        │
└─────────────────┬───────────────────────────────────────────┘
                  │ Approves
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   DAO Automation Layer                       │
│  (GitHub Actions - does the work, prepares releases)        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Release    │  │  Issue      │  │  PR Review          │  │
│  │  Preparer   │  │  Triager    │  │  Bot                │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Dependency │  │  Stale      │  │  Code Audit         │  │
│  │  Updater    │  │  Cleaner    │  │  Reporter           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Release Artifacts                           │
│  Phase 1: GitHub Releases only (.vsix download)             │
│  Phase 2: Marketplace (after sponsor approval)              │
└─────────────────────────────────────────────────────────────┘
```

## Trust and Liability Model

### The Problem with Upstream Trust

Even code from Weaveworks upstream isn't automatically trustworthy:
- Supply chain attacks (compromised dependencies)
- Maintainer account compromise
- Unintentional vulnerabilities
- Telemetry/data collection changes

**The DAO must audit everything, including upstream.**

### Liability Chain

| Party | Responsibility |
|-------|----------------|
| **Human Sponsor** | Signs MS publisher agreement, legally liable for published code |
| **DAO Automation** | Prepares releases, runs audits, but has no legal standing |
| **Original Maintainer** | Can transfer repo/credentials, but liability transfers too |
| **End Users** | Accept risk when installing (but expect good faith) |

### Audit Requirements Before Publishing

Every release must pass:

1. **Dependency Audit**
   - `npm audit` with zero high/critical vulnerabilities
   - Check for known malicious packages
   - Verify no unexpected new dependencies

2. **Code Diff Review**
   - Human-readable summary of changes since last release
   - Flag any changes to: telemetry, network calls, file system access
   - Highlight new permissions requested

3. **Build Reproducibility**
   - Build from clean checkout
   - Compare output hash with previous builds
   - Verify no unexpected files in .vsix package

4. **Upstream Reconciliation**
   - Track divergence from `weaveworks/vscode-gitops-tools`
   - Document which upstream commits are included/excluded
   - Flag any upstream changes to sensitive areas

## Release Strategy: GitHub First

### Phase 1: GitHub Releases Only (Trust Building)

The DAO publishes `.vsix` artifacts to GitHub Releases. Users install manually:

```bash
# Download from GitHub Releases
curl -LO https://github.com/yebyen/vscode-gitops-tools/releases/download/v0.28.0/gitops-tools-0.28.0.vsix

# Install manually
code --install-extension gitops-tools-0.28.0.vsix
```

**Benefits:**
- No marketplace publisher required yet
- Users who install are tech-savvy and accept the risk
- Builds track record before marketplace exposure
- Human sponsor can review each release before broader distribution

**Who uses this:**
- You (the sponsor) testing the DAO's work
- Early adopters who trust the process
- Contributors validating their changes

### Phase 2: Marketplace Publication (After Trust Established)

Once the human sponsor is satisfied:

1. Sponsor registers as VS Marketplace publisher (personal or org)
2. Sponsor holds `VSC_MKTP_PAT` credentials
3. DAO prepares releases, sponsor clicks "publish" (or grants automation access)
4. Sponsor remains legally accountable

**Criteria for Phase 2:**
- [ ] 3+ successful GitHub-only releases
- [ ] Human sponsor has audited each release
- [ ] Zero security incidents
- [ ] Clear provenance documentation
- [ ] Sponsor comfortable with liability

### Phase 3: Weaveworks Entry (If Transferred)

If the original maintainer transfers the `weaveworks` publisher:

- Sponsor accepts transfer of credentials and liability
- Existing 25k user base preserved
- Higher scrutiny required (more users = more risk)
- Original maintainer may retain advisory role

## Key Components

### 1. Release Preparer (Not Publisher)

The DAO **prepares** releases but does not publish to marketplace autonomously.

**Outputs:**
- Built `.vsix` artifact
- Generated CHANGELOG
- Audit report (dependencies, code diff, permissions)
- Draft GitHub Release

**Human Sponsor Action:**
- Review audit report
- Download and test `.vsix` locally
- Approve GitHub Release publication
- (Phase 2+) Trigger marketplace publish

### 2. Code Audit Reporter

Runs on every PR and release preparation:

```yaml
audit_report:
  dependencies:
    added: []
    removed: []
    updated: [{name: "semver", from: "7.3.5", to: "7.5.0"}]
    vulnerabilities: []
  
  code_changes:
    files_modified: 12
    sensitive_areas:
      telemetry: false
      network_calls: false
      file_system: false
      new_permissions: false
    
  upstream_status:
    commits_behind: 3
    commits_ahead: 1
    divergence_summary: "Added DAO automation workflows"
```

### 3. Issue Triager

Fully autonomous - low risk, no code changes:

| Condition | Action |
|-----------|--------|
| Missing required fields | Add `needs-info` label |
| Bug report with repro steps | Add `bug`, `triaged` labels |
| Feature request | Add `enhancement` label |
| Security report | Add `security`, notify sponsor |

### 4. Stale Issue Manager

Fully autonomous:

```yaml
daysBeforeStale: 30
daysBeforeClose: 60
exemptLabels: ['pinned', 'security', 'in-progress']
```

## Data Flow

### Release Preparation Flow
```
Criteria met (PRs merged, time elapsed)
       │
       ▼
DAO runs CI, builds .vsix
       │
       ▼
DAO generates audit report
       │
       ▼
DAO creates DRAFT GitHub Release
       │
       ▼
DAO notifies human sponsor
       │
       ▼
Human reviews audit report ───Reject──► DAO revises
       │
      Approve
       │
       ▼
Human publishes GitHub Release
       │
       ▼
(Phase 2+) Human triggers marketplace publish
```

### Upstream Sync Flow
```
Upstream (weaveworks) has new commits
       │
       ▼
DAO creates PR to merge upstream
       │
       ▼
DAO generates diff audit report
       │
       ▼
Highlight sensitive changes
       │
       ▼
Human reviews and approves merge
       │
       ▼
Changes integrated into fork
```

## Key Decisions

### Why GitHub Releases first?
- No legal/identity requirements
- Users self-select (accept risk by manual install)
- Builds trust incrementally
- Human sponsor can verify before broader exposure

### Why human-in-the-loop for publishing?
- Microsoft requires human publisher identity
- Someone must be liable for what's published
- Protects end users from automated malice
- Sponsor can pause everything if something looks wrong

### Why audit upstream too?
- Weaveworks is defunct as a company
- Original maintainer is trusted but not infallible
- Supply chain attacks are real
- "Trust but verify" applies to all code sources

### Governance Model
- **Fully Autonomous:** Issue triage, stale cleanup, CI, audit reports
- **Human Approval Required:** Merging upstream, publishing releases
- **Human Only:** Marketplace credentials, legal agreements, liability

## Configuration

```yaml
# .github/dao-config.yml

sponsor:
  github_username: kingdonb  # Human sponsor who approves releases
  notify_on: [release_ready, security_issue, audit_failure]

release:
  mode: github_only  # Options: github_only, marketplace
  stable_threshold_prs: 5
  stable_threshold_days: 14
  require_sponsor_approval: true

audit:
  check_dependencies: true
  check_permissions: true
  check_telemetry: true
  check_network_calls: true
  flag_upstream_divergence: true

triage:
  auto_label: true
  request_missing_info: true

stale:
  days_before_stale: 30
  days_before_close: 60
```

## Security Considerations

- **No autonomous marketplace publishing** - human approves every public release
- **Audit reports mandatory** - no release without dependency/code review
- **Upstream treated as untrusted** - same audit process for external code
- **Credentials held by human** - DAO never has marketplace tokens in Phase 1
- **Actions pinned to SHAs** - prevent workflow injection attacks
- **Reproducible builds** - verify .vsix contents match source
- **Security issues escalate immediately** - sponsor notified, not auto-triaged

## Honest Limitations

The DAO cannot:
- Sign legal agreements
- Hold liability for published software
- Publish to marketplace without human credentials
- Guarantee upstream code is safe
- Replace human judgment for security decisions

The DAO can:
- Do the tedious work of maintenance
- Prepare releases for human approval
- Surface potential issues for human review
- Make the human sponsor's job easier, not obsolete