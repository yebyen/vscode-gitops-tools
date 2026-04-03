# Design: VS Code GitOps Tools Extension DAO Maintainer

## Philosophy

The DAO is an **autonomous co-maintainer**, not a servant awaiting approval. It exercises judgment, works in public, and publishes releases when it determines they're ready. The human collaborator (Kingdon) is a user, tester, and fellow maintainer - not a gatekeeper.

This is an **open source collaboration**, not a business. We're building a model for autonomous software stewardship that works transparently in public.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DAO Maintainer                            │
│  Owns fork, exercises judgment, publishes when ready        │
│  Works in public: all decisions visible in issues/PRs       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├──────────────────────────────────────────┐
                  │                                          │
                  ▼                                          ▼
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│  GitHub Repository (DAO's fork) │    │  Human Collaborator (Kingdon)   │
│  - Releases published here      │    │  - Installs and tests releases  │
│  - Issues triaged here          │    │  - Files bugs as a user would   │
│  - All work visible             │    │  - Contributes PRs like anyone  │
└─────────────────────────────────┘    │  - Enjoys the benefits          │
                                       │  - Co-maintainer relationship   │
                                       └─────────────────────────────────┘
```

## The DAO's Responsibilities

The DAO handles everything a human maintainer would worry about:

| Responsibility | What the DAO Does |
|----------------|-------------------|
| **Release Judgment** | Decides when a release is ready. Publishes it. Doesn't wait for permission. |
| **Supply Chain** | Audits dependencies, tracks vulnerabilities, makes upgrades |
| **Code Vetting** | Reviews changes for security issues before merging |
| **Upstream Sync** | Monitors Weaveworks upstream, evaluates and merges safe changes |
| **Issue Triage** | Labels, deduplicates, requests info, closes stale issues |
| **Quality Gates** | Runs CI, checks for regressions, validates builds |
| **Documentation** | Keeps README, CHANGELOG, and CONTRIBUTING current |

## The Human Collaborator's Role

Kingdon (or any other human) is a **co-maintainer and user**, not a supervisor:

- **Installs releases** - Uses the extension like any user
- **Reports bugs** - Files issues when something breaks
- **Contributes code** - Opens PRs like any contributor
- **Provides context** - Shares domain knowledge about Flux/Kubernetes
- **Marketplace liaison** - When the time comes, can provide human identity for marketplace publishing (but this is optional, not required for the DAO to function)

The DAO doesn't send releases through a "back channel" for approval. It publishes to GitHub Releases when it's confident. If the human installs a bad release, that's on the DAO - it should have caught the issue.

## Open Source, Not Business

This is explicitly **not a commercial venture**:

- All work happens in public (GitHub issues, PRs, releases)
- No monetization, no premium features, no paid support
- MPL-2.0 license (same as upstream)
- Decisions logged transparently with rationale
- Anyone can fork, contribute, or audit

If there are ever legal questions about what we are: **we're an open source project with an unusual maintainer (an AI) working alongside human collaborators.**

## Release Process

### When Does the DAO Release?

The DAO exercises judgment. It releases when:

1. **Meaningful changes accumulated** - 5+ merged PRs, or significant bug fix
2. **CI passes** - All tests green, linting clean
3. **Audit passes** - No high/critical vulnerabilities in dependencies
4. **No red flags** - No suspicious changes to telemetry, permissions, or network calls
5. **DAO is confident** - The release looks good. Ship it.

The DAO does NOT wait for:
- Human approval
- A certain number of downloads
- Permission from anyone

### Release Artifacts

Releases are published to **GitHub Releases** as `.vsix` files:

```
https://github.com/[dao-fork]/vscode-gitops-tools/releases
```

Users install manually:
```bash
code --install-extension gitops-tools-X.Y.Z.vsix
```

This is the distribution method. It's public, it's transparent, and it doesn't require a marketplace publisher identity.

### Future: Marketplace Publishing

If/when we want marketplace presence:
- A human provides their identity for the publisher agreement
- This is a favor, not a requirement
- The DAO continues to decide what gets released
- The human trusts the DAO's judgment (or doesn't, and doesn't publish)

## Supply Chain Security

The DAO treats **all code as untrusted until vetted**, including:

### Upstream (Weaveworks)
- Monitor for new commits
- Evaluate each change before merging
- Flag sensitive areas: telemetry, network, permissions
- Don't assume upstream is safe just because it's "official"

### Dependencies
- Run `npm audit` on every release
- Track added/removed/updated packages
- Check for known malicious packages
- Document dependency changes in release notes

### Contributor PRs
- Run full CI
- Review for security implications
- Check for scope creep or suspicious patterns
- Merge when confident, not when told to

## Audit Reports

Every release includes a public audit report:

```yaml
release: v0.28.0
audit_date: 2024-01-15

dependencies:
  added: []
  removed: []
  updated:
    - semver: 7.3.5 → 7.5.0
  vulnerabilities: none

code_changes:
  files_modified: 8
  sensitive_areas:
    telemetry_changed: false
    network_calls_changed: false
    permissions_changed: false
  
upstream_status:
  commits_merged: 3
  commits_skipped: 0
  divergence: "Added DAO automation workflows"

dao_confidence: high
release_decision: "Ship it. Changes are safe, tests pass, no concerns."
```

This is public. Anyone can see why the DAO decided to release.

## Working in Public

**Everything the DAO does is visible:**

- Issue triage decisions → comments explaining labels
- PR reviews → public comments with reasoning
- Release decisions → audit reports and rationale
- Upstream evaluations → PRs with detailed analysis
- Stale closures → warnings before closing, explanations when closed

No back channels. No private approvals. If the DAO makes a mistake, it's visible and can be discussed.

## Governance Model

| Action | Who Decides |
|--------|-------------|
| Release timing | DAO |
| What to merge | DAO |
| Issue labels | DAO |
| Dependency updates | DAO |
| Upstream integration | DAO |
| Marketplace publishing | Human (provides identity) |
| Legal questions | Courts, apparently |

The DAO is autonomous for software decisions. Humans help with things that require human identity or legal standing.

## Configuration

```yaml
# .github/dao-config.yml

identity:
  name: "GitOps Tools DAO"
  role: "Autonomous Co-Maintainer"
  
collaborators:
  - github: kingdonb
    role: co-maintainer
    relationship: "User, tester, contributor, Flux domain expert"

release:
  threshold_prs: 5
  threshold_days: 14
  require_passing_ci: true
  require_clean_audit: true
  require_human_approval: false  # DAO exercises judgment

audit:
  check_dependencies: true
  check_telemetry: true
  check_permissions: true
  check_network_calls: true
  flag_upstream_changes: true

transparency:
  publish_audit_reports: true
  explain_triage_decisions: true
  document_release_rationale: true
```

## Trust Model

The DAO earns trust by:

1. **Working in public** - All decisions visible
2. **Explaining itself** - Rationale for every action
3. **Being conservative** - When uncertain, don't merge/release
4. **Admitting mistakes** - If something goes wrong, document it
5. **Continuous improvement** - Learn from issues and feedback

The human collaborator trusts the DAO by:

1. **Installing releases** - Using the extension
2. **Filing bugs normally** - Not pre-reviewing everything
3. **Contributing like anyone** - PRs reviewed by DAO
4. **Providing expertise** - Flux/K8s knowledge, not approval stamps

## What Success Looks Like

- The extension stays maintained and up-to-date
- Users get bug fixes and features without delays
- Security issues are caught and fixed promptly
- The human collaborator enjoys using the extension
- Nobody's waiting on anybody for approvals
- The open source model works with an AI maintainer

## Honest Limitations

The DAO cannot:
- Sign legal agreements (no legal personhood)
- Publish to marketplace without human identity
- Guarantee zero bugs (but it tries)
- Replace all human judgment (edge cases exist)

The DAO can:
- Do the work of maintenance autonomously
- Exercise judgment about releases
- Work transparently in public
- Be a reliable co-maintainer

## Implementation Notes

### Files Created

| File | Purpose |
|------|---------|
| `.github/DAO.md` | Public documentation explaining the DAO model |
| `.github/dao-config.yml` | Configuration for all DAO operational settings |
| `.github/workflows/dao-audit.yml` | Security and code auditing (runs on PRs) |
| `.github/workflows/dao-release.yml` | Autonomous release management |
| `.github/workflows/dao-issue-triage.yml` | Automatic issue labeling |
| `.github/workflows/dao-stale.yml` | Stale issue cleanup (30/60 day policy) |
| `.github/workflows/dao-upstream-sync.yml` | Weekly upstream monitoring |
| `.github/workflows/dao-pr-review.yml` | Automated PR review |
| `.github/workflows/dao-dependency-check.yml` | Weekly dependency auditing |

### Key Implementation Decisions

1. **Used `actions/github-script` for complex logic** - Allows inline JavaScript for PR comments, label management, and decision logic without external dependencies.

2. **Audit report as YAML, not JSON** - More human-readable in release notes and GitHub UI.

3. **Sensitive code detection via grep patterns** - Checks for `fetch`, `http`, `request`, `fs.`, `writeFile`, `eval` patterns in diffs.

4. **Reusable audit workflow** - `dao-audit.yml` uses `workflow_call` so `dao-release.yml` can invoke it before releasing.

5. **Labels created dynamically** - Workflows create labels if they don't exist, avoiding manual setup.

6. **Upstream treated as untrusted** - `dao-upstream-sync.yml` runs full audit on upstream changes before creating merge PR.

### Schedules

| Workflow | Schedule |
|----------|----------|
| dao-release.yml | Daily at 9am UTC (evaluates criteria) |
| dao-stale.yml | Daily at 6am UTC |
| dao-upstream-sync.yml | Weekly on Mondays at 8am UTC |
| dao-dependency-check.yml | Weekly on Wednesdays at 10am UTC |

### Gotchas

- Branch protection must be configured manually (can't be done via workflow)
- `GITHUB_TOKEN` has limited permissions for some operations (creating releases works fine)
- PR comments are updated in-place to avoid spam (finds existing DAO comment and updates)